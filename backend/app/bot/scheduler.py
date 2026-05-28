from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.auth.models import User
from app.services import generate_and_upload_for_user
from app.bot.whatsapp import send_whatsapp_image
from zoneinfo import ZoneInfo
from dotenv import load_dotenv
from datetime import datetime

import os

load_dotenv()

PHONE_NUMBER = os.getenv("WHATSAPP_PHONE_NUMBER")

scheduler = BackgroundScheduler(
    timezone=ZoneInfo("Asia/Jakarta")
)

def daily_wallpaper_job():
    print(f"Job executed at {datetime.now()}")

    db = SessionLocal()

    try:

        # your constant user
        username = "admin"
        user = db.query(User).filter(User.username == username).first()

        if not user:
            print("No user found")
            return

        result = generate_and_upload_for_user(
            user.tasks_data,
            user_id=user.id
        )

        image_url = result["path"]
        print(f"Generated wallpaper URL: {image_url}")

        send_whatsapp_image(
            PHONE_NUMBER,
            image_url
        )

        print("Wallpaper sent successfully")

    except Exception as e:
        print(e)

    finally:
        db.close()


def start_scheduler():

    scheduler.add_job(
        daily_wallpaper_job,
        trigger="cron",
        hour=8,
        minute=0,
        id="daily_wallpaper",
        misfire_grace_time=300,
        coalesce=True,
        max_instances=1,
    )

    # scheduler.add_job(
    #     daily_wallpaper_job,
    #     trigger="interval",
    #     minutes=1,
    #     id="daily_wallpaper_test"
    # )
    
    scheduler.start()