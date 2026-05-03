"""
PostgreSQL checkpointer and thread helper functions.
Standalone module — no circular deps.
"""

import os

from dotenv import load_dotenv
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

from pdf_ingestion import _THREAD_METADATA, _THREAD_RETRIEVERS

# -------------------
# Checkpointer
# -------------------
conn = sqlite3.connect(database="chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)


# -------------------
# Helpers
# -------------------
def retrieve_all_threads():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)


def thread_has_document(thread_id: str) -> bool:
    return str(thread_id) in _THREAD_RETRIEVERS


def thread_document_metadata(thread_id: str) -> dict:
    return _THREAD_METADATA.get(str(thread_id), {})


def delete_thread(thread_id: str):
    with pool.connection() as conn:
        conn.execute("DELETE FROM checkpoints WHERE thread_id = %s", (thread_id,))
        conn.execute("DELETE FROM checkpoint_writes WHERE thread_id = %s", (thread_id,))
        conn.execute("DELETE FROM checkpoint_blobs WHERE thread_id = %s", (thread_id,))
        conn.execute(
            "DELETE FROM message_timestamps WHERE thread_id = %s", (thread_id,)
        )
        conn.execute("DELETE FROM chat_threads WHERE thread_id = %s", (thread_id,))


def create_user(email: str, password_hash: str):
    with pool.connection() as conn:
        row = conn.execute(
            """INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id,email,created_at""",
            (email, password_hash),
        ).fetchone()

        return {"id": row[0], "email": row[1], "created_at": row[2]}


def delete_user(user_id: int) -> bool:
    with pool.connection() as conn:
        row = conn.execute(
            "DELETE FROM users WHERE id = %s",
            (user_id,),
        )
        deleted = row.rowcount > 0
        return deleted


def create_thread_for_user(thread_id: str, user_id: int):
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO chat_threads (thread_id,user_id) VALUES (%s,%s)",
            (
                thread_id,
                user_id,
            ),
        )


def get_all_threads_for_user(user_id: int):
    with pool.connection() as conn:
        rows = conn.execute(
            "SELECT thread_id FROM chat_threads WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()

        return [row[0] for row in rows]


def get_thread_owner(thread_id: str):
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT user_id FROM chat_threads WHERE thread_id = %s",
            (thread_id,),
        ).fetchone()

        return row[0] if row else None
