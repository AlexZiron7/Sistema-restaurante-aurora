; ===========================================================================
; Script Inno Setup para Sistema Restaurante
; Aurora Devs - Generado automaticamente
; Requiere Inno Setup 6+ (https://jrsoftware.org/isdl.php)
; ===========================================================================
; Uso:  iscc dist-setup.iss
;       o desde npm:  npm run dist
; ===========================================================================

#define MyAppName      "Aurora RES"
#define MyAppVersion   "1.0.0"
#define MyAppPublisher "Aurora Devs"
#define MyAppURL       "https://auroradevs.com"
#define MyAppExeName   "AuroraRES.exe"
#define MyAppPort      "4001"

; ===========================================================================
; [Setup] - Configuracion general del instalador
; ===========================================================================
[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName}
; --- Compresion ---
Compression=lzma2/ultra64
SolidCompression=yes
; --- Salida ---
OutputDir=installer
OutputBaseFilename=Setup-SistemaRestaurante-v{#MyAppVersion}
; --- Permisos ---
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
; --- Comportamiento ---
CloseApplications=force
RestartApplications=no
DisableStartupPrompt=yes
AllowNoIcons=yes
; --- Apariencia del wizard ---
WizardStyle=modern
WizardSizePercent=110
SetupIconFile=client\public\logo-aplicacion.ico
; WizardImageFile=assets\wizard.bmp   ; <-- Descomenta si tienes banner 164x314
; WizardSmallImageFile=assets\logo.bmp; <-- Descomenta si tienes logo 55x58

; ===========================================================================
; [Languages] - Idioma del instalador
; ===========================================================================
[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

; ===========================================================================
; [Messages] - Textos personalizados
; ===========================================================================
[Messages]
BeveledLabel=Aurora Devs - {#MyAppName} v{#MyAppVersion}

; ===========================================================================
; [CustomMessages] - Mensajes customizados en español
; ===========================================================================
[CustomMessages]
spanish.CreateDesktopIcon=Crear acceso directo en el &Escritorio
spanish.CreateAutoStart=Iniciar automaticamente con &Windows
spanish.LaunchAfterInstall=Iniciar {#MyAppName} ahora
spanish.FirewallException=Agregar excepcion de &Firewall (recomendado para tablets)

; ===========================================================================
; [Tasks] - Opciones que el usuario puede seleccionar
; ===========================================================================
[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "Accesos directos:"
Name: "autostart";   Description: "{cm:CreateAutoStart}";   GroupDescription: "Opciones adicionales:"
Name: "firewall";    Description: "{cm:FirewallException}";  GroupDescription: "Opciones adicionales:"; Flags: checkedonce

; ===========================================================================
; [Files] - Archivos a instalar
; ===========================================================================
[Files]
; Ejecutable principal (compilado con pkg)
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Base de datos demo (solo si no existe, para no sobreescribir datos del usuario)
Source: "restaurante-demo.db"; DestDir: "{app}"; DestName: "restaurante-demo.db"; Flags: ignoreversion onlyifdoesntexist

; Imagenes demo para el menu
Source: "public\demo\*"; DestDir: "{app}\public\demo"; Flags: ignoreversion recursesubdirs createallsubdirs

; Carpeta uploads (crear vacia para que el sistema funcione)
Source: "public\uploads\*"; DestDir: "{app}\public\uploads"; Flags: ignoreversion recursesubdirs createallsubdirs onlyifdoesntexist

; ===========================================================================
; [Dirs] - Directorios a crear (con permisos de escritura)
[Dirs]
Name: "{app}"; Permissions: users-modify
Name: "{app}\public\uploads"; Permissions: users-modify
Name: "{app}\public\demo";    Permissions: users-modify

; ===========================================================================
; [InstallDelete] - Limpiar basura antes de instalar nueva version
; ===========================================================================
[InstallDelete]
Type: files; Name: "{app}\.license_cache"

; ===========================================================================
; [Icons] - Accesos directos
; ===========================================================================
[Icons]
; Menu inicio
Name: "{group}\{#MyAppName}";           Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

; Escritorio (solo si el usuario lo pidio)
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

; ===========================================================================
; [Run] - Ejecutar despues de instalar
; ===========================================================================
[Run]
; Agregar excepcion de Firewall para permitir conexiones de tablets
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""{#MyAppName}"" dir=in action=allow program=""{app}\{#MyAppExeName}"" enable=yes profile=private"; Flags: runhidden; Tasks: firewall
Filename: "netsh"; Parameters: "advfirewall firewall add rule name=""{#MyAppName} Puerto"" dir=in action=allow protocol=TCP localport={#MyAppPort} enable=yes profile=private"; Flags: runhidden; Tasks: firewall

; Iniciar la aplicacion al terminar (opcional)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchAfterInstall}"; Flags: nowait postinstall skipifsilent unchecked; WorkingDir: "{app}"

; ===========================================================================
; [UninstallRun] - Ejecutar al desinstalar
; ===========================================================================
[UninstallRun]
; Cerrar la aplicacion si esta corriendo
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; Flags: runhidden

; Eliminar reglas de firewall creadas
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName}"""; Flags: runhidden
Filename: "netsh"; Parameters: "advfirewall firewall delete rule name=""{#MyAppName} Puerto"""; Flags: runhidden

; ===========================================================================
; [UninstallDelete] - Archivos a eliminar al desinstalar
; ===========================================================================
[UninstallDelete]
Type: filesandordirs; Name: "{app}\public"
Type: files; Name: "{app}\.license_cache"

; ===========================================================================
; [Registry] - Entradas de registro
; ===========================================================================
[Registry]
; Autoinicio con Windows (solo si el usuario lo pidio)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; \
  ValueType: string; ValueName: "{#MyAppName}"; \
  ValueData: """{app}\{#MyAppExeName}"""; \
  Flags: uninsdeletevalue; Tasks: autostart

; ===========================================================================
; [Code] - Logica personalizada en Pascal Script
; ===========================================================================
[Code]

// Verifica si ya hay una instancia del instalador corriendo
function InitializeSetup: Boolean;
var
  ResultCode: Integer;
begin
  Result := True;

  // Verificar si la app esta corriendo y ofrecer cerrarla
  if CheckForMutexes('{#MyAppName}_Mutex') then
  begin
    if MsgBox('El {#MyAppName} esta en ejecucion.' + #13#10 +
              '¿Desea cerrarlo para continuar con la instalacion?',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      Exec('taskkill', '/f /im {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Sleep(1000);
    end else
    begin
      Result := False;
    end;
  end;
end;

// Cerrar la aplicacion antes de desinstalar
function InitializeUninstall: Boolean;
var
  ResultCode: Integer;
begin
  Result := True;
  Exec('taskkill', '/f /im {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(500);
end;

// Preguntar si desea eliminar la base de datos al desinstalar
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
  begin
    if MsgBox('¿Desea eliminar tambien la base de datos del restaurante?' + #13#10 +
              '(Esto borrara TODOS los productos, mesas, ventas, etc.)',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      DeleteFile(ExpandConstant('{app}\restaurante.db'));
      DeleteFile(ExpandConstant('{app}\restaurante-demo.db'));
    end;
  end;
end;
