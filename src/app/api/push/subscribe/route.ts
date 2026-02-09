import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/src/lib/supabase/route-handler"

/**
 * POST body: { subscriber_id: string }
 * Saves the PushAlert subscriber ID for the current user so we can send personalized daily summaries.
 */
export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { subscriber_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const subscriberId = body.subscriber_id?.trim()
  if (!subscriberId) {
    return NextResponse.json({ error: "subscriber_id required" }, { status: 400 })
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    { user_id: user.id, subscriber_id: subscriberId, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  )
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
