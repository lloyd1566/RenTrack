import { NextRequest, NextResponse } from "next/server";
import { createAgentApplication, getAgentApplications, initDatabase, getAdminSupabase, createNotification, reviewAgentApplication, createUser, deleteUser, findUserByEmail } from "@/lib/db";
import { requireRole } from "@/lib/api-security";
import { createRentTrackEmailTemplate, getSiteUrl, sendEmail } from "@/lib/mail";
import { randomBytes } from "crypto";

const LOCATIONS = ["Cebu", "Manila", "Davao", "Butuan"];

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const address = String(form.get("address") || "");
    const resume = form.get("resume");
    if (!name || !email || !address || !LOCATIONS.includes(address) || !(resume instanceof File)) {
      return NextResponse.json({ success: false, error: "Name, email, location, and resume are required" }, { status: 400 });
    }
    if (resume.size > 5 * 1024 * 1024 || !["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(resume.type)) {
      return NextResponse.json({ success: false, error: "Resume must be a PDF or Word document up to 5 MB" }, { status: 400 });
    }
    const existing = await getAdminSupabase().from("agent_applications").select("id, status").eq("email", email).eq("status", "pending").maybeSingle();
    if (existing.data) return NextResponse.json({ success: false, error: "You already have a pending application" }, { status: 409 });
    const application = await createAgentApplication({
      name, email, address, phone: String(form.get("phone") || "").trim(),
      gender: String(form.get("gender") || "").trim(), birthdate: String(form.get("birthdate") || "").trim(),
      resumeData: Buffer.from(await resume.arrayBuffer()), resumeName: resume.name, resumeMimeType: resume.type,
    });
    const owners = await getAdminSupabase().from("users").select("id").in("role", ["owner", "admin"]);
    await Promise.all((owners.data || []).map((owner: { id: string }) => createNotification({
      userId: owner.id, title: "New Agent Applicant", message: `${name} applied to become an agent in ${address}.`, type: "system", read: false,
    })));
    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Agent application error:", error);
    return NextResponse.json({ success: false, error: "Unable to submit application" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const applications = await getAgentApplications(new URL(request.url).searchParams.get("status") || undefined);
    return NextResponse.json({ success: true, applications });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load applications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRole(request, ["owner", "admin"]);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id, status } = await request.json();
    if (!id || !["approved", "rejected"].includes(status)) return NextResponse.json({ success: false, error: "Invalid review request" }, { status: 400 });

    if (status === "approved") {
      const application = (await getAgentApplications("pending")).find((item) => item.id === id);
      if (!application) return NextResponse.json({ success: false, error: "Pending application not found" }, { status: 404 });

      if (await findUserByEmail(application.email)) {
        return NextResponse.json({ success: false, error: "An account already exists for this applicant email" }, { status: 409 });
      }

      const temporaryPassword = randomBytes(12).toString("base64url");
      const agent = await createUser(
        application.name,
        application.email,
        temporaryPassword,
        "agent",
        application.phone || undefined,
        undefined,
        application.address
      );

      let reviewedApplication;
      try {
        reviewedApplication = await reviewAgentApplication(id, status, auth.userId);
      } catch (reviewError) {
        await deleteUser(agent.id);
        throw reviewError;
      }

      let emailSent = false;
      try {
        const loginUrl = `${getSiteUrl(request.nextUrl.origin)}/login`;
        await sendEmail({
          to: application.email,
          subject: "Your RentTrack agent account is ready",
          text: `Hello ${application.name},\n\nYour agent application has been approved.\n\nUsername: ${application.email}\nTemporary password: ${temporaryPassword}\n\nSign in at: ${loginUrl}\n\nBefore your first sign-in, request a verification code from the verification page. Please change your password after signing in.`,
          html: createRentTrackEmailTemplate({
            title: "Your agent account is ready",
            body: `Hello ${application.name},\n\nYour agent application has been approved. Sign in using the temporary credentials below.`,
            messageBlock: `Username: ${application.email}\nTemporary password: ${temporaryPassword}`,
            ctaLabel: "Sign in to RentTrack",
            ctaUrl: loginUrl,
            footerNote: "Request a verification code before your first sign-in, then change your password. Keep this email private.",
          }),
        });
        emailSent = true;
      } catch (emailError) {
        console.error("Approved agent credentials email failed:", emailError);
      }

      await createNotification({ userId: auth.userId, title: "Agent application approved", message: `${application.name}'s agent account was created.`, type: "system", read: false });
      return NextResponse.json({ success: true, application: reviewedApplication, agent, emailSent, ...(!emailSent ? { temporaryPassword } : {}) });
    }

    const application = await reviewAgentApplication(id, status, auth.userId);
    await createNotification({ userId: auth.userId, title: `Agent application ${status}`, message: `${application.name}'s application was ${status}.`, type: "system", read: false });
    return NextResponse.json({ success: true, application });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to review application" }, { status: 500 });
  }
}
