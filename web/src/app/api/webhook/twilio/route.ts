import { NextRequest, NextResponse } from 'next/server'

/**
 * Twilio SMS Webhook — POST /api/webhook/twilio
 * Proxies the Twilio inbound payload to the FastAPI backend.
 * This Next.js route exists so the same domain can optionally
 * receive webhooks when deploying web + api together.
 * In local dev, point Twilio directly at ngrok → FastAPI /messages/webhook.
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const body = Object.fromEntries(formData.entries())

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  try {
    const res = await fetch(`${apiUrl}/messages/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const twimlResponse = await res.text()
    return new NextResponse(twimlResponse, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  } catch {
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { 'Content-Type': 'application/xml' } }
    )
  }
}
