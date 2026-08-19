import { NextResponse } from "next/server";
import { addCreatorToSheet } from "@/lib/google-sheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, userId } = body;

    if (!name || !email || !userId) {
      return NextResponse.json(
        { error: "Data creator tidak lengkap" },
        { status: 400 }
      );
    }

    await addCreatorToSheet({
      name,
      email,
      userId,
      
    });

    return NextResponse.json({
      success: true,
      message: "Creator berhasil ditambahkan ke Google Sheets",
    });
  } catch (error) {
    console.error("Google Sheets error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Gagal menyimpan data ke Google Sheets",
      },
      { status: 500 }
    );
  }
}