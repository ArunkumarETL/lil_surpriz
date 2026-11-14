import { getSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = { title: "Website Settings" };

export default async function AdminSettings() {
  return <SettingsForm settings={await getSettings()} />;
}
