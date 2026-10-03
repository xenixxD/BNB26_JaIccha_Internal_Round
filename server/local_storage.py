import os
import shutil

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA_DIR = os.path.join(SERVER_DIR, "data")
CONFIGURED_DATA_DIR = os.getenv("CREATORAI_LOCAL_DATA_DIR")
DATA_DIR = os.path.abspath(CONFIGURED_DATA_DIR or DEFAULT_DATA_DIR)
ASSETS_DIR = os.path.join(DATA_DIR, "assets")
OUTPUTS_DIR = os.path.join(DATA_DIR, "outputs")
TEMP_DIR = os.path.join(DATA_DIR, "temp")

for directory in (DATA_DIR, ASSETS_DIR, OUTPUTS_DIR, TEMP_DIR):
    os.makedirs(directory, exist_ok=True)


def migrate_legacy_local_data() -> None:
    if CONFIGURED_DATA_DIR:
        return

    legacy_database = os.path.join(SERVER_DIR, "creatorai.db")
    current_database = os.path.join(DATA_DIR, "creatorai.db")
    if os.path.isfile(legacy_database) and not os.path.exists(current_database):
        shutil.copy2(legacy_database, current_database)

    for legacy_name, destination in (
        ("uploads", ASSETS_DIR),
        ("exports", OUTPUTS_DIR),
    ):
        legacy_directory = os.path.join(SERVER_DIR, legacy_name)
        if not os.path.isdir(legacy_directory):
            continue
        for filename in os.listdir(legacy_directory):
            source = os.path.join(legacy_directory, filename)
            target = os.path.join(destination, filename)
            if os.path.isfile(source) and not os.path.exists(target):
                shutil.copy2(source, target)
