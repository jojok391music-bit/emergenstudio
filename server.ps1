$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host "Server is running. Open http://localhost:8080/ in your browser."
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $requestUrl = $context.Request.Url.LocalPath
        $method = $context.Request.HttpMethod
        
        # API Routes
        if ($requestUrl.StartsWith('/api/')) {
            $context.Response.Headers.Add("Access-Control-Allow-Origin", "*")
            $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            $context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, X-Filename")

            if ($method -eq 'OPTIONS') {
                $context.Response.StatusCode = 204
                $context.Response.Close()
                continue
            }

            if ($method -eq 'GET' -and $requestUrl -eq '/api/settings') {
                $dbPath = Join-Path (Get-Location).Path "database.json"
                if (Test-Path $dbPath) {
                    $content = [System.IO.File]::ReadAllBytes($dbPath)
                } else {
                    $content = [System.Text.Encoding]::UTF8.GetBytes("{}")
                }
                $context.Response.ContentType = 'application/json'
                $context.Response.ContentLength64 = $content.Length
                $context.Response.OutputStream.Write($content, 0, $content.Length)
            }
            elseif ($method -eq 'POST' -and $requestUrl -eq '/api/settings') {
                $dbPath = Join-Path (Get-Location).Path "database.json"
                $reader = New-Object System.IO.StreamReader($context.Request.InputStream)
                $json = $reader.ReadToEnd()
                [System.IO.File]::WriteAllText($dbPath, $json)
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok"}')
                $context.Response.ContentType = 'application/json'
                $context.Response.ContentLength64 = $resBytes.Length
                $context.Response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            elseif ($method -eq 'POST' -and $requestUrl -eq '/api/upload') {
                $filename = $context.Request.Headers["X-Filename"]
                if (-not $filename) { $filename = "upload.bin" }
                
                # Sanitize filename to prevent path traversal
                $filename = [System.IO.Path]::GetFileName($filename)
                
                $uploadDir = Join-Path (Get-Location).Path "uploads"
                if (-not (Test-Path $uploadDir)) { New-Item -ItemType Directory -Force -Path $uploadDir | Out-Null }
                
                $filePath = Join-Path $uploadDir $filename
                
                $fileStream = [System.IO.File]::Create($filePath)
                $context.Request.InputStream.CopyTo($fileStream)
                $fileStream.Close()
                
                $resBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok", "path":"/uploads/' + $filename + '"}')
                $context.Response.ContentType = 'application/json'
                $context.Response.ContentLength64 = $resBytes.Length
                $context.Response.OutputStream.Write($resBytes, 0, $resBytes.Length)
            }
            else {
                $context.Response.StatusCode = 404
            }
            $context.Response.Close()
            continue
        }
        
        # Static Files
        if ($requestUrl -eq '/') { $requestUrl = '/index.html' }
        $filePath = Join-Path (Get-Location).Path $requestUrl
        
        # Prevent directory traversal
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $basePath = [System.IO.Path]::GetFullPath((Get-Location).Path)
        if (-not $fullPath.StartsWith($basePath)) {
            $context.Response.StatusCode = 403
            $context.Response.Close()
            continue
        }

        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $context.Response.ContentLength64 = $content.Length
            
            if ($filePath.EndsWith('.css')) { $context.Response.ContentType = 'text/css' }
            elseif ($filePath.EndsWith('.js')) { $context.Response.ContentType = 'application/javascript' }
            elseif ($filePath.EndsWith('.html')) { $context.Response.ContentType = 'text/html' }
            elseif ($filePath.EndsWith('.svg')) { $context.Response.ContentType = 'image/svg+xml' }
            elseif ($filePath.EndsWith('.pdf')) { $context.Response.ContentType = 'application/pdf' }
            elseif ($filePath.EndsWith('.mp4')) { $context.Response.ContentType = 'video/mp4' }
            elseif ($filePath.EndsWith('.webm')) { $context.Response.ContentType = 'video/webm' }
            elseif ($filePath.EndsWith('.jpg') -or $filePath.EndsWith('.jpeg')) { $context.Response.ContentType = 'image/jpeg' }
            elseif ($filePath.EndsWith('.png')) { $context.Response.ContentType = 'image/png' }
            
            $context.Response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $context.Response.StatusCode = 404
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
