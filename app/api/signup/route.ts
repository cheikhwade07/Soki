// app/api/signup/route.ts
import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { z } from 'zod';


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require', prepare: false });

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const parsed = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(body);

        if (!parsed.success) {
            return Response.json({ error: 'Invalid email or password (min 6 chars).' }, { status: 400 });
        }

        const { email, password } = parsed.data;

        // Check if user already exists
        const existing = await sql`SELECT user_id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            return Response.json({ error: 'Email already in use.' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hashedPassword})
    `;

        return Response.json({ message: 'Account created.' }, { status: 201 });
    } catch (error) {
        console.error('Signup error:', error);
        return Response.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
