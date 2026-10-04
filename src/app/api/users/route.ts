import { db } from "@/configs/db";
import { Users } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, imageUrl } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email));

    if (existingUser.length > 0) {
      return NextResponse.json({
        message: "User already exists",
        user: existingUser[0],
      });
    }

    const newUser = await db
      .insert(Users)
      .values({
        name: name ?? "",
        email,
        imageUrl: imageUrl ?? "",
      })
      .returning();

    return NextResponse.json({
      message: "User created successfully",
      user: newUser[0],
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  }
}