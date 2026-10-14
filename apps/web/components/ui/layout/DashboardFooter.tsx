import { copy } from "@/copy";

/** Dashboard footer: copyright plus non-navigating protocol labels. */
export default function DashboardFooter() {
  return (
    <footer className="dash-footer">
      <div className="dash-footer-inner">
        <span>{copy.dashboard.footer}</span>
        <span className="dash-footer-links" aria-hidden="true">
          <span>{copy.dashboard.footerPrivacy}</span>
          <span>{copy.dashboard.footerDocs}</span>
          <span>{copy.dashboard.footerStatus}</span>
        </span>
      </div>
    </footer>
  );
}
