tryExec defaults read '%PATH%/%NAME%.app/Contents/Info.plist'
defaultTo
save out

extract CFBundleShortVersionString\s+=\s+"([\d\.]+)";
defaultTo
save version

load out
extract CFBundleName\s+=\s+"?([^;\"]+)"?;
defaultTo %NAME%
save name

remove out
