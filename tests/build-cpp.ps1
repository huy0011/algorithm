# C++ 示例编译验证（阶段二）
#
# 为什么单独用 PowerShell 而不是在 Node 里做：
#   本机沙箱禁止 Node 的 child_process 以 piped stdio 启动子进程
#   （会得到 `spawnSync g++ EPERM`）。但 PowerShell 直接调用外部程序是可以的，
#   所以把「编译运行」这一步放在这里，Node 只负责生成源文件与收集结果。
#
# 用法：
#   node tests/build-cpp.js          # 阶段一：写出 .cpp
#   pwsh tests/build-cpp.ps1         # 阶段二：编译运行（本脚本）
#   node tests/build-cpp.js --collect # 阶段三：收集成 cpp-output.json

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $root '.cpp-build'

if (-not (Test-Path $buildDir)) {
    Write-Host "找不到 .cpp-build 目录，请先运行: node tests/build-cpp.js" -ForegroundColor Red
    exit 1
}

# 探测编译器
$cxx = $null
foreach ($cand in @('g++', 'clang++')) {
    $cmd = Get-Command $cand -ErrorAction SilentlyContinue
    if ($cmd) { $cxx = $cmd.Source; break }
}
if (-not $cxx) {
    Write-Host "找不到 C++ 编译器（尝试过 g++ / clang++）" -ForegroundColor Red
    exit 1
}

$version = (& $cxx --version 2>&1 | Select-Object -First 1)
Write-Host "C++ 示例编译验证（阶段二：编译运行）"
Write-Host ("=" * 58)
Write-Host "编译器: $version"
Write-Host ""

# 记录编译器版本，供收集阶段写进 cpp-output.json
# （不编造版本号：用了哪个编译器必须可追溯）
$utf8NoBomEarly = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $buildDir 'compiler.txt'), $version, $utf8NoBomEarly)

$results = @{}
$ok = 0
$fail = 0

Get-ChildItem -Path $buildDir -Filter *.cpp | Sort-Object Name | ForEach-Object {
    $id = $_.BaseName
    $exe = Join-Path $buildDir "$id.exe"

    # 编译
    $compileOutput = & $cxx -std=c++17 -O2 -Wall -o $exe $_.FullName 2>&1
    if ($LASTEXITCODE -ne 0) {
        $fail++
        $err = ($compileOutput | Select-Object -First 4) -join ' | '
        $results[$id] = @{ ok = $false; error = $err; stdout = '' }
        Write-Host "  x $($id.PadRight(24)) 编译失败" -ForegroundColor Yellow
        return
    }

    # 运行（带超时，避免个别示例卡住）
    $job = Start-Job -ScriptBlock {
        param($exePath)
        & $exePath 2>&1
    } -ArgumentList $exe
    $finished = Wait-Job $job -Timeout 20
    if (-not $finished) {
        Stop-Job $job
        Remove-Job $job -Force
        $fail++
        $results[$id] = @{ ok = $false; error = '运行超时（超过 20 秒）'; stdout = '' }
        Write-Host "  x $($id.PadRight(24)) 运行超时" -ForegroundColor Yellow
        return
    }
    $runOutput = Receive-Job $job
    $runOk = $job.State -eq 'Completed'
    Remove-Job $job -Force

    if ($runOk) {
        $ok++
        $stdout = ($runOutput | Out-String).TrimEnd()
        $results[$id] = @{ ok = $true; error = ''; stdout = $stdout }
        $firstLine = ($stdout -split "`n" | Select-Object -First 1)
        Write-Host "  + $($id.PadRight(24)) $($firstLine.Substring(0, [Math]::Min(38, $firstLine.Length)))" -ForegroundColor Green
    } else {
        $fail++
        $err = ($runOutput | Out-String).Trim()
        $results[$id] = @{ ok = $false; error = $err; stdout = '' }
        Write-Host "  x $($id.PadRight(24)) 运行时错误" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host ("=" * 58)
Write-Host "编译运行: 成功 $ok / 失败 $fail"

# 写出结果（保持 UTF-8 无 BOM，避免 Node 解析出问题）
$json = $results | ConvertTo-Json -Depth 6
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $buildDir 'results.json'), $json, $utf8NoBom)
Write-Host "结果已写入 .cpp-build/results.json"
Write-Host ""
Write-Host "下一步: node tests/build-cpp.js --collect"

# 清理可执行文件
Get-ChildItem -Path $buildDir -Filter *.exe | Remove-Item -Force -ErrorAction SilentlyContinue

if ($fail -gt 0) { exit 1 }
exit 0
