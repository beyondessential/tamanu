<powershell>
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

$AuthorizedKeyFile = 'C:\ProgramData\ssh\administrators_authorized_keys'
New-Item $AuthorizedKeyFile
Set-Content $AuthorizedKeyFile '${authorized_keys}'

# Reset authorized_keys file ACL to enable SSH
# By default, it inherits parent folder permission, which is too permissive

$Acl = Get-Acl -Path $AuthorizedKeyFile

# disable inheritance
$isProtected = $true
$preserveInheritance = $false
$Acl.SetAccessRuleProtection($isProtected, $preserveInheritance)

$Administrators = 'BUILTIN\Administrators'
$System = 'SYSTEM'
$FullControl = 'FullControl'

$AdministratorAccessRule = New-Object Security.AccessControl.FileSystemAccessRule $Administrators, $FullControl, 'Allow'
$SystemAccessRule = New-Object Security.AccessControl.FileSystemAccessRule $System, $FullControl, 'Allow'

$Acl.SetAccessRule($AdministratorAccessRule)
$Acl.SetAccessRule($SystemAccessRule)

Set-Acl -Path $AuthorizedKeyFile -AclObject $Acl
</powershell>
