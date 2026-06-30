import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ExternalLink, ArrowLeft, Send, CheckCircle } from "lucide-react";

export default function SubmitJob() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    const job = {
      title: data.get("title"),
      url: data.get("url"),
      company: data.get("company"),
      location: data.get("location"),
      type: data.get("type"),
      source: data.get("source"),
      description: data.get("description"),
      date_posted: new Date().toISOString().split("T")[0]
    };

    const existing = JSON.parse(localStorage.getItem("manual_jobs") || "[]");
    existing.unshift(job);
    localStorage.setItem("manual_jobs", JSON.stringify(existing));
    setSubmitted(true);
    form.reset();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-primary" style={{ fontFamily: "'Georgia', serif" }}>
              Submit a Job
            </h1>
          </div>
        </div>
      </header>

      <section className="py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 border-border">
            <h2 className="text-2xl font-bold text-primary mb-2" style={{ fontFamily: "'Georgia', serif" }}>
              Add a Job Link
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Found a job on Facebook, Telegram, or another site? Paste the link here to add it to the board.
            </p>

            {submitted && (
              <div className="flex items-center gap-3 bg-secondary/10 text-secondary rounded-lg p-4 mb-6">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Job saved! It will appear after the next scraper run (or refresh).</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Job Title *</label>
                <Input name="title" required placeholder="e.g. Project Manager" />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Job URL *</label>
                <Input name="url" required type="url" placeholder="https://facebook.com/... or https://t.me/..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Company</label>
                  <Input name="company" placeholder="e.g. UNICEF" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Location</label>
                  <Input name="location" placeholder="e.g. Mogadishu, Somalia" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Job Type</label>
                  <Select name="type" defaultValue="NGO">
                    <SelectTrigger>
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
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Source</label>
                  <Select name="source" defaultValue="Facebook">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Telegram">Telegram</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Twitter">Twitter/X</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
                <Textarea name="description" placeholder="Brief description of the role..." rows={3} />
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Send className="w-4 h-4" /> Submit Job
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}
