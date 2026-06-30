import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, MapPin, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

interface SavedJob {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
}

export default function Profile() {
  const { theme, toggleTheme } = useTheme();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("saved_jobs_data") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("saved_jobs_data", JSON.stringify(savedJobs));
  }, [savedJobs]);

  const removeSaved = (id: number) => {
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="p-5 bg-card border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Theme Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">
              Currently using {theme === "dark" ? "dark" : "light"} theme
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="border-border"
          >
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 bg-card border-border">
        <h2 className="text-sm font-semibold text-foreground mb-4">Saved Jobs</h2>
        {savedJobs.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No saved jobs yet.</p>
            <Link href="/">
              <Button variant="ghost" size="sm" className="mt-2 text-xs">
                Browse Jobs
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background border border-border"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {job.source}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeSaved(job.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
