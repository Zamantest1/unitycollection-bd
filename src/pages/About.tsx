import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Heart, Target, Users, Award, ShieldCheck, Shirt, Facebook, Instagram } from "lucide-react";
const LOGO_URL = "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";
const fadeInUp = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  },
  transition: {
    duration: 0.5
  }
};
const About = () => {
  return <Layout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="bg-secondary py-12">
          <div className="container mx-auto px-4 text-center">
            <motion.img src={LOGO_URL} alt="Unity Collection" className="h-20 w-auto mx-auto mb-6" initial={{
            scale: 0.8,
            opacity: 0
          }} animate={{
            scale: 1,
            opacity: 1
          }} transition={{
            duration: 0.5
          }} />
            <motion.h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground" {...fadeInUp}>
              About <span className="text-gold">Unity Collection</span>
            </motion.h1>
            <motion.p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            delay: 0.3
          }}>
              Premium Bangladeshi Traditional Men's Clothing Brand
            </motion.p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Our Story */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                Our <span className="text-gold">Story</span>
              </h2>
              <div className="space-y-4 text-muted leading-relaxed">
                <p>
                  <strong className="text-foreground"> (Panjabi)</strong> is a Bangladeshi traditional clothing brand focused on men's ethnic wear, especially <span className="text-gold font-medium">Punjabi (Panjabi)</span>, designed for cultural, religious, and festive occasions such as Eid, Ramadan, weddings, and special family events.
                </p>
                <p>
                  The brand was initially operated as a seasonal business, mainly active during Eid collections. Over time, Unity Collection has built strong customer trust and demand, leading to a decision to transform the business into a long-term, year-round brand with a strong online presence.
                </p>
                <p>
                  Based in <strong className="text-foreground">Rajshahi, Bangladesh</strong>, we are committed to bringing premium quality traditional menswear to customers across the country, combining cultural authenticity with modern convenience.
                </p>
              </div>
            </div>
          </motion.section>

          {/* What We Emphasize */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              What We <span className="text-gold">Emphasize</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[{
              icon: Shirt,
              label: "Quality Fabric Selection"
            }, {
              icon: Heart,
              label: "Elegant & Modest Designs"
            }, {
              icon: Users,
              label: "Comfortable Fits"
            }, {
              icon: Award,
              label: "Affordable Pricing"
            }].map((item, index) => <motion.div key={item.label} className="bg-card rounded-lg p-5 text-center shadow-sm hover:shadow-md transition-shadow" initial={{
              opacity: 0,
              scale: 0.9
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.1,
              duration: 0.4
            }}>
                  <div className="w-12 h-12 rounded-full bg-gold-soft flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                </motion.div>)}
            </div>
          </motion.section>

          {/* Vision */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="bg-secondary rounded-xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-gold-foreground" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
                Our <span className="text-gold">Vision</span>
              </h2>
              <p className="text-primary-foreground/90 text-lg leading-relaxed">
                To become a trusted and recognizable Bangladeshi traditional menswear brand, offering premium-quality Punjabi collections while maintaining accessibility for everyday customers.
              </p>
            </div>
          </motion.section>

          {/* Brand Values */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
              Our <span className="text-gold">Values</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[{
              icon: ShieldCheck,
              title: "Trust & Transparency",
              description: "We believe in honest communication and reliable service with every customer interaction."
            }, {
              icon: Heart,
              title: "Cultural Authenticity",
              description: "Preserving and celebrating Bangladeshi traditional fashion with every design we create."
            }, {
              icon: Users,
              title: "Customer Satisfaction",
              description: "Building long-term relationships through quality products and exceptional service."
            }].map((value, index) => <motion.div key={value.title} className="bg-card rounded-lg p-6 shadow-sm text-center" initial={{
              opacity: 0,
              y: 20
            }} whileInView={{
              opacity: 1,
              y: 0
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.15,
              duration: 0.5
            }}>
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted">{value.description}</p>
                </motion.div>)}
            </div>
          </motion.section>

          {/* Product Focus */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }}>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-6">
              Our <span className="text-gold">Collections</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {["Casual Punjabi", "Eid Collection", "Festive Punjabi", "Premium Collection", "Semi-Premium", "All Sizes Available"].map((item, index) => <motion.span key={item} className="bg-gold-soft text-foreground px-4 py-2 rounded-full text-sm font-medium" initial={{
              opacity: 0,
              scale: 0.8
            }} whileInView={{
              opacity: 1,
              scale: 1
            }} viewport={{
              once: true
            }} transition={{
              delay: index * 0.05
            }}>
                  {item}
                </motion.span>)}
            </div>
          </motion.section>

          {/* Owner */}
          <motion.section initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.6
        }} className="text-center space-y-4">
            <p className="text-muted">
              Founded & Managed by{" "}
              <a href="https://www.facebook.com/ibn.e.habib.528372" target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:text-gold transition-colors">
                Ibn E Habib
              </a>
            </p>
            <div className="flex justify-center gap-4">
              <a href="https://www.facebook.com/UnityCollectionBd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-gold transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-primary-foreground" />
              </a>
              <a href="https://www.instagram.com/unitycollectionbd" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-gold transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-primary-foreground" />
              </a>
            </div>
          </motion.section>
        </div>
      </div>
    </Layout>;
};
export default About;