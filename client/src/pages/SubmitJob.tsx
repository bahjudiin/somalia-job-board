import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle } from "lucide-react";

export default function SubmitJob() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const job = {
      title: String(data.get("title") || "").trim(),
      url: String(data.get("url") || "").trim(),
      company: String(data.get("company") || "").trim(),
      location: String(data.get("location") || "Somalia").trim(),
      type: String(data.get("type") || "NGO").trim(),
      source: String(data.get("source") || "Manual").trim(),
      description: String(data.get("description") || "").trim(),
      date_posted: new Date().toISOString().split("T")[0]
    };

    if (!job.title || !job.url) return;

    const existing = JSON.parse(localStorage.getItem("manual_jobs") || "[]");
    existing.unshift(job);
    localStorage.setItem("manual_jobs", JSON.stringify(existing));
    setSubmitted(true);
    form.reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-1">Add a Job Link</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Found a job on Facebook, Telegram, or another site? Paste the link here.
        </p>

        {submitted && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-lg p-3 mb-4 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Job saved. Go to Home to see it.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Job Title *</label>
            <Input name="title" required placeholder="e.g. Project Manager" className="bg-input border-border" />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Job URL *</label>
            <Input name="url" required type="url" placeholder="https://..." className="bg-input border-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Company</label>
              <Input name="company" placeholder="e.g. UNICEF" className="bg-input border-border" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Location</label>
              <Input name="location" placeholder="e.g. Mogadishu" defaultValue="Somalia" className="bg-input border-border" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Job Type</label>
              <Select name="type" defaultValue="NGO">
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Private">Private Sector</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Source</label>
              <Select name="source" defaultValue="Manual">
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Telegram">Telegram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
            <Textarea name="description" placeholder="Brief description..." rows={3} className="bg-input border-border" />
          </div>

          <Button type="submit" className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Send className="w-4 h-4" /> Submit Job
          </Button>
        </form>
      </Card>
    </div>
  );
}
