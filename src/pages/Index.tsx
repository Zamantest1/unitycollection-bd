import { Layout } from "@/components/layout/Layout";
import { HeroBanner } from "@/components/home/HeroBanner";
import { TrustStrip } from "@/components/home/TrustStrip";
import { CategoryLinks } from "@/components/home/CategoryLinks";
import { EditorialSpotlight } from "@/components/home/EditorialSpotlight";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

const Index = () => {
  return (
    <Layout>
      <HeroBanner />
      <TrustStrip />
      <CategoryLinks />
      <EditorialSpotlight />
      <FeaturedProducts />
      <WhyChooseUs />
    </Layout>
  );
};

export default Index;
