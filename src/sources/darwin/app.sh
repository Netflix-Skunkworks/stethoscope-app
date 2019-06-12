tryExec defaults read /Applications/Slack.app/Contents/Info.plist
save out

extract CFBundleShortVersionString\s+=\s+"([\d\.]+)";
save version

load out
extract CFBundleName\s+=\s+"?([^;]+)"?;
save name

remove out
