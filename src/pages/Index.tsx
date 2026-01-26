import { Layout } from "@/components/layout/Layout";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryLinks } from "@/components/home/CategoryLinks";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";

const Index = () => {
  return (
    <Layout>
      <HeroBanner />
      <CategoryLinks />
      <FeaturedProducts />
      <WhyChooseUs />
    </Layout>
  );
};

export default Index;
