import TemplateHeader from "@/components/TemplateHeader";
import TemplateHero from "@/components/TemplateHero";
import TemplateFeatures from "@/components/TemplateFeatures";
import TemplateStats from "@/components/TemplateStats";
import TemplateTestimonial from "@/components/TemplateTestimonial";
import TemplateCursor from "@/components/TemplateCursor";

export default function Home() {
  return (
    <div className="page-wrapper">
      <TemplateCursor />
      <TemplateHeader />
      <TemplateHero />
      <TemplateFeatures />
      <TemplateStats />
      <TemplateTestimonial />
    </div>
  );
}