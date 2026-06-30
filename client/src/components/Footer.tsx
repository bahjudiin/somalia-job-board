export default function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="container text-center">
        <p className="text-xs text-muted-foreground">
          Somalia Job Board &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
