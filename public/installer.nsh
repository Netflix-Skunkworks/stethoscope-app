!macro customInstall
  DetailPrint "Register Stethoscope URI Handler"
  DeleteRegKey HKCR "stethoscope"
  WriteRegStr HKCR "stethoscope" "" "URL:stethoscope"
  WriteRegStr HKCR "stethoscope" "URL Protocol" ""
  WriteRegStr HKCR "stethoscope\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "stethoscope\shell" "" ""
  WriteRegStr HKCR "stethoscope\shell\Open" "" ""
  WriteRegStr HKCR "stethoscope\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend
