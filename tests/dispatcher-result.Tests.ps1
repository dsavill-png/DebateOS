param([string] $Workflow = '.github/workflows/codex-dispatcher.yml')
$ErrorActionPreference = 'Stop'
$yaml = Get-Content -Raw -LiteralPath $Workflow
$report = ($yaml -split '(?m)^  report:\r?$', 2)[1]
$source = ($report -split '(?m)^        run: \|\r?$', 2)[1] -replace '(?m)^ {10}', ''
$runReport = [scriptblock]::Create($source)
$env:GITHUB_SERVER_URL = 'https://github.com'
$env:GITHUB_REPOSITORY = 'dsavill-png/DebateOS'
$env:GITHUB_RUN_ID = '56'
$env:SOURCE_ID = '42'
$env:TASK = '998'
$env:TASK_REASON = "Check with @other`nNo changes"
$env:GITHUB_STEP_SUMMARY = Join-Path (Split-Path -Parent (Resolve-Path -LiteralPath $Workflow)) ('dispatcher-test-' + [guid]::NewGuid() + '.md')
$script:marker = '<!-- debateos-codex-result:42 -->'
$script:posted = @()

function gh {
  $global:LASTEXITCODE = 0
  if ($args[1] -eq '--paginate') {
    if ($script:lookupFails) { $global:LASTEXITCODE = 1; return }
    return $script:comments
  }
  if ($args[0] -eq 'pr') { return $script:draft }
  if ($args[1] -ne '--method' -or $args[2] -ne 'POST') { throw "Unexpected gh call: $args" }
  $script:posted += ($args[5] -replace '^body=', '')
  return 'https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-43'
}

try {
  foreach ($case in @(
    @{ status = 'completed'; publish = 'success'; failure = 'false'; result = 'success'; next = 'Review the draft PR'; draft = 'https://github.com/dsavill-png/DebateOS/pull/2' }
    @{ status = 'partial'; publish = 'success'; failure = 'false'; result = 'partial'; next = 'Review the draft PR'; draft = 'https://github.com/dsavill-png/DebateOS/pull/2' }
    @{ status = 'blocked'; publish = 'skipped'; failure = 'false'; result = 'blocked'; next = 'Review the blocker'; draft = '' }
    @{ status = 'blocked'; publish = 'skipped'; failure = 'true'; result = 'failure'; next = 'Escalate'; draft = '' }
    @{ status = 'completed'; publish = 'failure'; failure = 'false'; result = 'failure'; next = 'Escalate'; draft = '' }
    @{ status = ''; publish = 'skipped'; failure = ''; result = 'failure'; next = 'Escalate'; draft = '' }
  )) {
    $env:TASK_STATUS = $case.status
    $env:PUBLISH_RESULT = $case.publish
    $env:PIPELINE_FAILURE = $case.failure
    $script:draft = $case.draft
    $script:comments = @('{"user":{"login":"someone"},"body":"<!-- debateos-codex-result:42 -->"}')
    $script:posted = @()
    & $runReport
    $body = $script:posted[0]
    $expectedDraft = if ($case.draft) { $case.draft } else { 'none' }
    if ($script:posted.Count -ne 1 -or
        -not $body.StartsWith("Codex TASK-998 result: $($case.result).") -or
        -not $body.Contains("Draft PR: $expectedDraft.") -or
        -not $body.Contains("@dsavill-png $([char]0x2014) $($case.next)") -or
        -not $body.EndsWith($script:marker) -or
        $body.Contains('@other') -or
        $body -match '(?m)^No changes') {
      throw "Incorrect first handoff for $($case.status)/$($case.publish): $body"
    }
    $script:comments += @(@{
      user = @{ login = 'github-actions[bot]' }
      body = $body
      html_url = 'https://github.com/dsavill-png/DebateOS/pull/1#issuecomment-43'
    } | ConvertTo-Json -Depth 4 -Compress)
    & $runReport
    if ($script:posted.Count -ne 1) { throw 'Replay posted a second result.' }
  }

  $script:lookupFails = $true
  $script:posted = @()
  try {
    & $runReport
    throw 'Lookup error was ignored.'
  } catch {
    if ($_.Exception.Message -ne 'Unable to check for an existing dispatcher result.') { throw }
  }
  if ($script:posted.Count -ne 0) { throw 'Published after a failed dedupe lookup.' }

  Write-Output 'Passed six result cases, six replays, and failed dedupe lookup.'
} finally {
  Remove-Item -LiteralPath $env:GITHUB_STEP_SUMMARY
}
