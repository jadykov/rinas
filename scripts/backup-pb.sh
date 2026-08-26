#!/usr/bin/env bash
#
# Бэкап данных PocketBase (каталог /pb/pb_data из контейнера) на хост.
# Создаёт tar.gz-архив в каталоге BACKUP_DIR (по умолчанию ./backups).
#
# Настройка по cron (пример — каждую ночь в 03:05):
#   5 3 * * * cd /rinas && /rinas/scripts/backup-pb.sh >> /rinas/backups/backup.log 2>&1
#
# Проверка вручную: bash scripts/backup-pb.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUTFILE="$BACKUP_DIR/pb_data_${STAMP}.tar.gz"

if ! docker compose ps --status running pocketbase >/dev/null 2>&1; then
  echo "Ошибка: контейнер pocketbase не запущен. Поднимите инфраструктуру: docker compose up -d" >&2
  exit 1
fi

# Потоковый tar из контейнера сразу на хост — архив не занимает место в томе.
docker compose exec -T pocketbase tar czf - -C /pb/pb_data . > "$OUTFILE"

echo "Бэкап сохранён: $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"

# Оставляем последние N архивов (по умолчанию 14), старые удаляем.
KEEP="${BACKUP_KEEP:-14}"
mapfile -t old < <(ls -1t "$BACKUP_DIR"/pb_data_*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)))
for f in "${old[@]}"; do
  rm -f "$f"
  echo "Удалён старый бэкап: $f"
done