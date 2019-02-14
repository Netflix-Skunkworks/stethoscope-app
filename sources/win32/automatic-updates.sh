#/usr/bin/env kmd
exec powershell -Command \\$AUSettings=\\(New-Object -com Microsoft.Update.AutoUpdate\\).Settings\\;echo \\$AUSettings.NotificationLevel
parseInt
save automaticUpdatesNotificationLevel
