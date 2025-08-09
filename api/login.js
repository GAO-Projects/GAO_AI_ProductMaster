export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // 🔹 Securely stored in Vercel

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ message: "Admin password not set" });
  }

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, message: "Incorrect password" });
}
