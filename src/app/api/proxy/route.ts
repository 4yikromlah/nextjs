import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { method, url, headers: reqHeaders, body } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP/HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    const fetchOptions: RequestInit = {
      method: method || 'GET',
      headers: {
        ...reqHeaders,
        'User-Agent': 'API-Tester/1.0',
      },
    }

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      fetchOptions.body = body
    }

    const response = await fetch(url, {
      ...fetchOptions,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    const endTime = Date.now()
    const responseBody = await response.text()

    // Collect response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      size: new Blob([responseBody]).size,
      time: endTime - startTime,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      status: 0,
      statusText: 'Error',
      headers: {},
      body: JSON.stringify({ error: errorMessage }, null, 2),
      size: 0,
      time: 0,
    })
  }
}
