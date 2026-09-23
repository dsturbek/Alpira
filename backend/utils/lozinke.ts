import { hash, verify } from "@node-rs/argon2";

export const argon2Opcije = {
  algorithm: 2 as const,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashirajLozinku(lozinka: string): Promise<string> {
  return hash(lozinka, argon2Opcije);
}

export async function provjeriLozinku(hashLozinke: string, lozinka: string): Promise<boolean> {
  try {
    return await verify(hashLozinke, lozinka);
  } catch {
    return false;
  }
}
