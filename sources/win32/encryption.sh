exec reg query 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\PolicyManager\\current\\device\\Bitlocker'
extract EncryptionMethod\s+[A-Z_]+\s+0x([\d]+)
save encryptionMethod
