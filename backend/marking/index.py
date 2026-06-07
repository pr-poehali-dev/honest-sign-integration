"""
Главный API для интеграции с Честным знаком (ГИС МТ).
Поддерживает: управление настройками, заказы кодов, получение кодов, каталог, аналитику.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import psycopg2
import requests

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p24317549_honest_sign_integrat")
CZ_BASE = "https://ismp.crpt.ru/api/v3/true-api"
CZ_BASE_SANDBOX = "https://markirovka.sandbox.crpt.ru/api/v3/true-api"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token",
}


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False, default=str)}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_settings(cur):
    cur.execute(f"SELECT oms_id, client_token, api_key, env, inn, org_name, webhook_url, webhook_token FROM {SCHEMA}.settings WHERE id=1")
    row = cur.fetchone()
    if not row:
        return {}
    keys = ["oms_id", "client_token", "api_key", "env", "inn", "org_name", "webhook_url", "webhook_token"]
    return dict(zip(keys, row))


def cz_headers(settings: dict) -> dict:
    return {
        "clientToken": settings.get("client_token", ""),
        "Content-Type": "application/json",
    }


def cz_url(settings: dict, path: str) -> str:
    base = CZ_BASE_SANDBOX if settings.get("env") == "sandbox" else CZ_BASE
    return f"{base}{path}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── GET /settings ──────────────────────────────────────────────
        if method == "GET" and action == "settings":
            s = get_settings(cur)
            # Маскируем секреты при отдаче
            masked = {**s}
            if masked.get("client_token"):
                masked["client_token"] = "••••" + masked["client_token"][-6:]
            if masked.get("api_key"):
                masked["api_key"] = "••••" + masked["api_key"][-6:]
            if masked.get("webhook_token"):
                masked["webhook_token"] = "••••" + masked["webhook_token"][-6:]
            masked["configured"] = bool(s.get("oms_id") and s.get("client_token") and s.get("api_key"))
            return resp(200, masked)

        # ── POST /settings ─────────────────────────────────────────────
        if method == "POST" and action == "settings":
            fields = ["oms_id", "client_token", "api_key", "env", "inn", "org_name", "webhook_url", "webhook_token"]
            # Получаем текущие значения
            cur.execute(f"SELECT oms_id, client_token, api_key, env, inn, org_name, webhook_url, webhook_token FROM {SCHEMA}.settings WHERE id=1")
            row = cur.fetchone()
            current = dict(zip(fields, row)) if row else {}
            # Обновляем только переданные не-маскированные поля
            updates = {}
            for f in fields:
                val = body.get(f)
                if val is not None and not str(val).startswith("••••"):
                    updates[f] = val
                else:
                    updates[f] = current.get(f, "")
            cur.execute(
                f"""UPDATE {SCHEMA}.settings SET
                    oms_id=%s, client_token=%s, api_key=%s, env=%s,
                    inn=%s, org_name=%s, webhook_url=%s, webhook_token=%s,
                    updated_at=NOW()
                    WHERE id=1""",
                (updates["oms_id"], updates["client_token"], updates["api_key"], updates["env"],
                 updates["inn"], updates["org_name"], updates["webhook_url"], updates["webhook_token"])
            )
            conn.commit()
            return resp(200, {"ok": True, "message": "Настройки сохранены"})

        # ── POST /settings/check ───────────────────────────────────────
        if method == "POST" and action == "check":
            s = get_settings(cur)
            if not s.get("oms_id") or not s.get("client_token"):
                return resp(400, {"ok": False, "message": "Не заполнены OMS ID или Client Token"})
            try:
                url = cz_url(s, f"/ping")
                r = requests.get(url, headers=cz_headers(s), timeout=8)
                if r.status_code < 500:
                    return resp(200, {"ok": True, "message": f"Соединение установлено (HTTP {r.status_code})", "env": s.get("env")})
                return resp(200, {"ok": False, "message": f"Сервер ЧЗ вернул ошибку {r.status_code}"})
            except Exception as e:
                return resp(200, {"ok": False, "message": f"Нет соединения: {str(e)}"})

        # ── GET /orders ────────────────────────────────────────────────
        if method == "GET" and action == "orders":
            cur.execute(f"SELECT id, product, gtin, count, status, received, order_id_cz, created_at FROM {SCHEMA}.orders ORDER BY created_at DESC LIMIT 100")
            rows = cur.fetchall()
            orders = [{"id": r[0], "product": r[1], "gtin": r[2], "count": r[3], "status": r[4],
                        "received": r[5], "order_id_cz": r[6], "date": r[7].strftime("%d.%m.%Y") if r[7] else ""} for r in rows]
            return resp(200, {"orders": orders})

        # ── POST /orders ───────────────────────────────────────────────
        if method == "POST" and action == "create_order":
            s = get_settings(cur)
            gtin = body.get("gtin", "").strip()
            product = body.get("product", "").strip()
            count = int(body.get("count", 0))
            comment = body.get("comment", "")

            if not gtin or not product or count <= 0:
                return resp(400, {"ok": False, "message": "Заполните GTIN, наименование и количество"})

            order_id = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            order_id_cz = None
            cz_status = "pending"

            # Пробуем отправить в Честный знак если настроен
            if s.get("oms_id") and s.get("client_token"):
                try:
                    payload = {
                        "productGroup": "milk",
                        "createMethodType": "SELF_MADE",
                        "quantity": count,
                        "serialNumberType": "RANDOM",
                        "templateId": 10,
                        "gtin": gtin,
                    }
                    url = cz_url(s, f"/order/v4/{s['oms_id']}/create?omsId={s['oms_id']}")
                    r = requests.post(url, headers=cz_headers(s), json=payload, timeout=15)
                    if r.status_code == 200:
                        data = r.json()
                        order_id_cz = data.get("orderId")
                        cz_status = "processing"
                    else:
                        cz_status = "error"
                except Exception:
                    cz_status = "error"

            cur.execute(
                f"INSERT INTO {SCHEMA}.orders (id, product, gtin, count, status, received, order_id_cz) VALUES (%s,%s,%s,%s,%s,0,%s)",
                (order_id, product, gtin, count, cz_status, order_id_cz)
            )
            conn.commit()
            return resp(200, {"ok": True, "order": {"id": order_id, "status": cz_status, "order_id_cz": order_id_cz}})

        # ── POST /orders/sync ──────────────────────────────────────────
        if method == "POST" and action == "sync_order":
            s = get_settings(cur)
            order_id = body.get("order_id")
            cur.execute(f"SELECT order_id_cz, gtin, count FROM {SCHEMA}.orders WHERE id=%s", (order_id,))
            row = cur.fetchone()
            if not row or not row[0]:
                return resp(400, {"ok": False, "message": "Заказ не найден или не отправлен в ЧЗ"})
            order_id_cz, gtin, count = row

            try:
                url = cz_url(s, f"/order/v4/{s['oms_id']}/{order_id_cz}?omsId={s['oms_id']}")
                r = requests.get(url, headers=cz_headers(s), timeout=10)
                if r.status_code != 200:
                    return resp(200, {"ok": False, "message": f"ЧЗ вернул {r.status_code}"})
                data = r.json()
                cz_status = data.get("status", "")
                available = data.get("availableCodes", 0)

                new_status = "processing"
                if cz_status in ("READY", "CLOSED"):
                    new_status = "completed"
                elif cz_status == "ERROR":
                    new_status = "error"

                cur.execute(f"UPDATE {SCHEMA}.orders SET status=%s, received=%s WHERE id=%s", (new_status, available, order_id))
                conn.commit()
                return resp(200, {"ok": True, "status": new_status, "received": available, "cz_status": cz_status})
            except Exception as e:
                return resp(500, {"ok": False, "message": str(e)})

        # ── POST /codes/fetch ──────────────────────────────────────────
        if method == "POST" and action == "fetch_codes":
            s = get_settings(cur)
            order_id = body.get("order_id")
            cur.execute(f"SELECT order_id_cz, gtin, product FROM {SCHEMA}.orders WHERE id=%s", (order_id,))
            row = cur.fetchone()
            if not row or not row[0]:
                return resp(400, {"ok": False, "message": "Заказ не найден"})
            order_id_cz, gtin, product = row

            try:
                url = cz_url(s, f"/codes/v4/{s['oms_id']}?omsId={s['oms_id']}&orderId={order_id_cz}&gtin={gtin}&quantity=100&lastBlockId=0")
                r = requests.get(url, headers=cz_headers(s), timeout=20)
                if r.status_code != 200:
                    return resp(200, {"ok": False, "message": f"ЧЗ вернул {r.status_code}"})
                data = r.json()
                codes = data.get("codes", [])
                inserted = 0
                for code in codes:
                    serial = code[18:29] if len(code) > 28 else code[-11:]
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.codes (order_id, code, gtin, product, serial, status) VALUES (%s,%s,%s,%s,%s,'active') ON CONFLICT DO NOTHING",
                        (order_id, code, gtin, product, serial)
                    )
                    inserted += cur.rowcount
                conn.commit()
                return resp(200, {"ok": True, "fetched": len(codes), "inserted": inserted})
            except Exception as e:
                return resp(500, {"ok": False, "message": str(e)})

        # ── GET /codes ─────────────────────────────────────────────────
        if method == "GET" and action == "codes":
            search = params.get("search", "")
            status_filter = params.get("status", "all")
            q = f"SELECT code, gtin, product, serial, status, created_at FROM {SCHEMA}.codes WHERE 1=1"
            args = []
            if status_filter != "all":
                q += " AND status=%s"
                args.append(status_filter)
            if search:
                q += " AND (code ILIKE %s OR product ILIKE %s OR gtin ILIKE %s)"
                args += [f"%{search}%", f"%{search}%", f"%{search}%"]
            q += " ORDER BY created_at DESC LIMIT 200"
            cur.execute(q, args)
            rows = cur.fetchall()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.codes")
            total = cur.fetchone()[0]
            codes = [{"code": r[0], "gtin": r[1], "product": r[2], "serial": r[3],
                       "status": r[4], "created": r[5].strftime("%d.%m.%Y") if r[5] else ""} for r in rows]
            return resp(200, {"codes": codes, "total": total})

        # ── GET /analytics ─────────────────────────────────────────────
        if method == "GET" and action == "analytics":
            cur.execute(f"""
                SELECT
                    COUNT(*) as total_orders,
                    COALESCE(SUM(count), 0) as total_ordered,
                    COALESCE(SUM(received), 0) as total_received
                FROM {SCHEMA}.orders
            """)
            r = cur.fetchone()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.codes WHERE status='active'")
            active = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.codes WHERE status='used'")
            used = cur.fetchone()[0]
            cur.execute(f"""
                SELECT product, SUM(count) as ordered, SUM(received) as received
                FROM {SCHEMA}.orders
                GROUP BY product ORDER BY ordered DESC LIMIT 10
            """)
            products = [{"name": row[0], "total": int(row[1] or 0), "used": int(row[2] or 0),
                          "pct": round(int(row[2] or 0) / max(int(row[1] or 1), 1) * 100, 1)} for row in cur.fetchall()]
            return resp(200, {
                "total_orders": r[0], "total_ordered": int(r[1]), "total_received": int(r[2]),
                "active_codes": active, "used_codes": used,
                "products": products,
            })

        return resp(404, {"error": "Неизвестное действие"})

    finally:
        cur.close()
        conn.close()
