import { SiteHeader } from "@/components/layout/SiteHeader";
import { UtilityActions } from "@/components/layout/UtilityActions";
import { UtilityPage } from "@/components/layout/UtilityPage";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <UtilityPage
        command="cd /this-page"
        output="cd: no such file or directory: /this-page"
        code="404"
        title="Nothing at this path"
        actions={<UtilityActions />}
      >
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
      </UtilityPage>
    </div>
  );
}
