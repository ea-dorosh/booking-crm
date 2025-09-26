# 🚀 Быстрый Старт: Система Логирования

## 1. Коммит и Push
```bash
git add .
git commit -m "feat: добавлена система логирования и мониторинга ошибок"
git push origin master
```

## 2. GitHub Secrets
Добавь в настройки репозитория (Settings > Secrets):
```
SLACK_WEBHOOK=https://hooks.slack.com/your-webhook  # (опционально)
ALERT_EMAIL=your-email@domain.com                   # (опционально)
```

## 3. Деплой
GitHub Actions автоматически развернет все изменения!

## 4. Проверка
После деплоя:
```bash
# Через SSH на сервере
pm2 status booking-backend
ls -la backend/logs/
tail -f backend/logs/combined-$(date +%Y-%m-%d).log
```

## 5. Мониторинг
- **Dashboard**: `http://your-server.com/monitoring/error-dashboard.html`
- **CLI анализ**: `node scripts/log-analyzer.js analyze`
- **Emergency check**: `gh workflow run emergency-check.yml`

## 6. Что теперь логируется
✅ Все ошибки букинга с полным контекстом
✅ Календарные ошибки и производительность
✅ HTTP запросы и ответы
✅ Google Calendar API проблемы
✅ Database ошибки
✅ Валидационные ошибки

## 7. Когда что-то сломается
1. **Откройте dashboard** для быстрого обзора
2. **Запустите анализатор** для детального анализа
3. **Проверьте логи** для полного контекста
4. **Используйте emergency check** для критических ситуаций

**Готово! Теперь вы видите все ошибки пользователей! 🎉**
