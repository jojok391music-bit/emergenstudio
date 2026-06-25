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
                $rawFilename = $context.Request.Headers["X-Filename"]
                if ($rawFilename) {
                    $filename = [System.Uri]::UnescapeDataString($rawFilename)
                } else {
                    $filename = "upload.bin"
                }
                
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
            $fileStream = [System.IO.File]::OpenRead($filePath)
            $fileSize = $fileStream.Length
            
            $contentType = 'application/octet-stream'
            if ($filePath.EndsWith('.css')) { $contentType = 'text/css' }
            elseif ($filePath.EndsWith('.js')) { $contentType = 'application/javascript' }
            elseif ($filePath.EndsWith('.html')) { $contentType = 'text/html' }
            elseif ($filePath.EndsWith('.svg')) { $contentType = 'image/svg+xml' }
            elseif ($filePath.EndsWith('.pdf')) { $contentType = 'application/pdf' }
            elseif ($filePath.EndsWith('.mp4')) { $contentType = 'video/mp4' }
            elseif ($filePath.EndsWith('.webm')) { $contentType = 'video/webm' }
            elseif ($filePath.EndsWith('.jpg') -or $filePath.EndsWith('.jpeg')) { $contentType = 'image/jpeg' }
            elseif ($filePath.EndsWith('.png')) { $contentType = 'image/png' }
            
            $context.Response.ContentType = $contentType
            $context.Response.Headers.Add("Accept-Ranges", "bytes")
            
            $rangeHeader = $context.Request.Headers["Range"]
            if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                $range = $rangeHeader.Substring(6)
                $rangeParts = $range.Split('-')
                $start = 0
                $end = $fileSize - 1
                
                if ($rangeParts[0] -ne "") { $start = [long]$rangeParts[0] }
                if ($rangeParts.Length -gt 1 -and $rangeParts[1] -ne "") { $end = [long]$rangeParts[1] }
                
                if ($start -gt $end -or $start -ge $fileSize) {
                    $context.Response.StatusCode = 416
                    $context.Response.Headers.Add("Content-Range", "bytes */$fileSize")
                    $context.Response.Close()
                    $fileStream.Close()
                    continue
                }

                $length = $end - $start + 1
                $context.Response.StatusCode = 206
                $context.Response.Headers.Add("Content-Range", "bytes $start-$end/$fileSize")
                $context.Response.ContentLength64 = $length
                
                $fileStream.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                $buffer = New-Object byte[] 65536
                $bytesRemaining = $length
                while ($bytesRemaining -gt 0) {
                    $bytesToRead = if ($bytesRemaining -lt $buffer.Length) { [int]$bytesRemaining } else { $buffer.Length }
                    $bytesRead = $fileStream.Read($buffer, 0, $bytesToRead)
                    if ($bytesRead -eq 0) { break }
                    $context.Response.OutputStream.Write($buffer, 0, $bytesRead)
                    $bytesRemaining -= $bytesRead
                }
            } else {
                $context.Response.StatusCode = 200
                $context.Response.ContentLength64 = $fileSize
                $fileStream.CopyTo($context.Response.OutputStream)
            }
            $fileStream.Close()
        } else {
            $context.Response.StatusCode = 404
        }
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
