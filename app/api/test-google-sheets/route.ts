import { NextResponse } from "next/server";
import { addCreatorToSheet } from "@/lib/google-sheets";

export async function GET() {
  try {
    await addCreatorToSheet({
      name: "Test Creator",
      email: "test@ternakcreator.com",
      userId: "test-user-123",
    });

    return NextResponse.json({
      success: true,
      message: "Berhasil menambahkan data ke Google Sheets",
    });
  } catch (error) {
    console.error("Google Sheets error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan data ke Google Sheets",
      },
      { status: 500 }
    );
  }
}