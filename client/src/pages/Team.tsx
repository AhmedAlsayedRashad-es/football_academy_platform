import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Trophy, 
  GraduationCap, 
  Heart,
  Brain,
  Utensils,
  Dumbbell,
  Mail,
  Linkedin,
  ArrowLeft,
  Award,
  Globe,
  Calendar,
  Target,
  Shield,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from '@/contexts/LanguageContext';

export default function Team() {
  const { t, language } = useLanguage();
  // Try to fetch coach profiles from database
  const { data: dbCoachProfiles } = trpc.coachProfiles.getPublic.useQuery();

  const leadership = [
    {
      name: "Mohamed El-Sayed",
      role: "Academy Director",
      title: "Founder & Director",
      image: "/team-photo-1.jpg",
      bio: "Former professional player with 15+ years of coaching experience. Mohamed founded Future Stars Academy with a vision to develop complete athletes through holistic training methods. His philosophy combines European coaching methodologies with local talent development.",
      credentials: ["UEFA Pro License", "AFC A License", "Former National Team Player"],
      specialization: "Youth Development",
      yearsExperience: 18,
      achievements: ["Developed 25+ professional players", "Egyptian Youth League Champion 2022", "Best Academy Award 2023"],
      languages: ["Arabic", "English", "French"]
    },
    {
      name: "Ahmed Farouk",
      role: "Technical Director",
      title: "Technical Director",
      image: "/team-photo-2.jpg",
      bio: "Specialized in youth development methodology with extensive experience at top European academies. Ahmed brings cutting-edge training techniques and a data-driven approach to player development.",
      credentials: ["UEFA A License", "La Liga Academy Certified", "Youth Development Specialist"],
      specialization: "Technical Training",
      yearsExperience: 14,
      achievements: ["Former La Liga Academy Coach", "Developed U-17 National Team Players", "Technical Excellence Award"],
      languages: ["Arabic", "English", "Spanish"]
    }
  ];

  const coaches = [
    {
      name: "Karim Hassan",
      role: "Head Coach - U-18",
      specialty: "Tactical Development",
      specialization: "tactical",
      icon: <Trophy className="w-5 h-5" />,
      experience: 12,
      bio: "Expert in tactical awareness and game intelligence. Prepares players for the transition to professional football.",
      qualifications: ["UEFA B License", "AFC Youth Diploma"],
      achievements: ["U-18 League Runner-up 2023", "5 players signed to professional clubs"]
    },
    {
      name: "Omar Mahmoud",
      role: "Head Coach - U-16",
      specialty: "Technical Skills",
      specialization: "technical",
      icon: <GraduationCap className="w-5 h-5" />,
      experience: 10,
      bio: "Focuses on advanced technical skills and creative play. Known for developing skillful, confident players.",
      qualifications: ["UEFA B License", "Coerver Certified"],
      achievements: ["Technical Skills Award Winner", "U-16 Cup Champions 2022"]
    },
    {
      name: "Youssef Ali",
      role: "Head Coach - U-14",
      specialty: "Player Development",
      specialization: "youth_development",
      icon: <Users className="w-5 h-5" />,
      experience: 8,
      bio: "Specializes in the critical transition phase of youth development. Creates a positive learning environment.",
      qualifications: ["AFC B License", "Child Psychology Certification"],
      achievements: ["Youth Development Excellence Award", "100% player retention rate"]
    },
    {
      name: "Tarek Nour",
      role: "Head Coach - U-12",
      specialty: "Fundamentals",
      specialization: "youth_development",
      icon: <GraduationCap className="w-5 h-5" />,
      experience: 7,
      bio: "Expert in teaching football fundamentals through fun, engaging sessions. Builds strong foundations for young players.",
      qualifications: ["AFC C License", "Grassroots Coaching Diploma"],
      achievements: ["Best Grassroots Coach 2023", "Developed 50+ academy players"]
    },
    {
      name: "Hassan Ibrahim",
      role: "Goalkeeper Coach",
      specialty: "Goalkeeper Training",
      specialization: "goalkeeping",
      icon: <Shield className="w-5 h-5" />,
      experience: 15,
      bio: "Former professional goalkeeper with extensive experience training elite-level keepers. Focuses on modern goalkeeper techniques.",
      qualifications: ["UEFA Goalkeeper A License", "Former Professional GK"],
      achievements: ["Trained 3 National Team Goalkeepers", "15 years professional experience"]
    },
    {
      name: "Mahmoud Fathy",
      role: "Fitness Coach",
      specialty: "Strength & Conditioning",
      specialization: "fitness",
      icon: <Dumbbell className="w-5 h-5" />,
      experience: 6,
      bio: "Certified strength and conditioning specialist focusing on age-appropriate physical development and injury prevention.",
      qualifications: ["NSCA-CSCS", "Youth Fitness Specialist"],
      achievements: ["Reduced injury rates by 40%", "Improved squad fitness metrics"]
    }
  ];

  const specialists = [
    {
      name: "Dr. Sarah Ahmed",
      role: "Sports Psychologist",
      specialty: "Mental Performance",
      icon: <Brain className="w-6 h-6" />,
      description: "PhD in Sports Psychology from Cairo University. Specializes in youth athlete mental health, performance anxiety, and building mental resilience. Works with players individually and in group sessions.",
      color: "bg-purple-500/10 text-purple-500",
      qualifications: ["PhD Sports Psychology", "Licensed Clinical Psychologist", "Youth Mental Health Specialist"],
      experience: 10
    },
    {
      name: "Dr. Layla Hassan",
      role: "Sports Nutritionist",
      specialty: "Performance Nutrition",
      icon: <Utensils className="w-6 h-6" />,
      description: "Registered dietitian with expertise in youth athlete nutrition and growth optimization. Creates personalized meal plans and educates families on proper sports nutrition.",
      color: "bg-green-500/10 text-green-700 dark:text-green-500",
      qualifications: ["MSc Sports Nutrition", "Registered Dietitian", "Youth Nutrition Specialist"],
      experience: 8
    },
    {
      name: "Mohamed Sherif",
      role: "Physical Trainer",
      specialty: "Strength & Conditioning",
      icon: <Dumbbell className="w-6 h-6" />,
      description: "Certified strength coach specializing in age-appropriate training and injury prevention. Designs progressive training programs that develop athleticism safely.",
      color: "bg-blue-500/10 text-blue-500",
      qualifications: ["NSCA-CSCS", "Youth Strength Specialist", "Movement Assessment Certified"],
      experience: 9
    },
    {
      name: "Dr. Ahmed Khalil",
      role: "Team Physiotherapist",
      specialty: "Injury Rehabilitation",
      icon: <Heart className="w-6 h-6" />,
      description: "Sports medicine specialist with experience in professional football club rehabilitation. Manages injury prevention, treatment, and return-to-play protocols.",
      color: "bg-red-500/10 text-red-500",
      qualifications: ["DPT", "Sports Rehabilitation Specialist", "FIFA Medical Network"],
      experience: 12
    }
  ];

  const specializationColors: Record<string, string> = {
    technical: "bg-blue-500",
    tactical: "bg-yellow-500",
    fitness: "bg-green-500",
    goalkeeping: "bg-purple-500",
    youth_development: "bg-orange-500",
    mental: "bg-pink-500",
    nutrition: "bg-emerald-500"
  };

  return (
    <div >
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-foreground">Future Stars Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/events">
              <Button variant="ghost">Events</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Users className="w-5 h-5" />
            <span className="font-medium">Our Coaching Staff</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Meet Our <span className="text-primary">Expert Team</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            World-class coaches, sports scientists, and specialists dedicated to developing the next generation of football stars.
          </p>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Academy Leadership</h2>
            <p className="text-muted-foreground">The visionaries behind Future Stars Academy</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {leadership.map((leader, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    src={leader.image} 
                    alt={leader.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground">{leader.title}</Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">{leader.name}</h3>
                      <p className="text-primary font-medium">{leader.role}</p>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{leader.yearsExperience} years</span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{leader.bio}</p>
                  
                  {/* Credentials */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Qualifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {leader.credentials.map((cred, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {cred}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      Key Achievements
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {leader.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Languages */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="w-4 h-4" />
                    <span>{leader.languages.join(", ")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Staff Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Coaching Staff</h2>
            <p className="text-muted-foreground">Expert coaches for every age group and specialization</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coaches.map((coach, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-primary">
                        {coach.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${specializationColors[coach.specialization]} flex items-center justify-center`}>
                      <Target className="w-3 h-3 text-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{coach.name}</h3>
                    <p className="text-primary text-sm font-medium">{coach.role}</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      {coach.icon}
                      <span>{coach.specialty}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mt-4">{coach.bio}</p>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{coach.experience} years experience</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {coach.qualifications.map((qual, i) => {
                      const isFifa = /fifa/i.test(qual);
                      const isUefa = /uefa/i.test(qual);
                      const isAfc = /afc/i.test(qual);
                      return (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`text-xs flex items-center gap-1 ${
                            isFifa ? "bg-[#1a3c6e] text-white border-[#1a3c6e] font-bold" :
                            isUefa ? "bg-[#003399] text-white border-[#003399] font-semibold" :
                            isAfc  ? "bg-[#c8102e] text-foreground border-[#c8102e] font-semibold" : ""
                          }`}
                        >
                          {(isFifa || isUefa || isAfc) && <Award className="w-2.5 h-2.5" />}
                          {qual}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {coach.achievements.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Trophy className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                      <span>{coach.achievements[0]}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Performance Specialists</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our multidisciplinary team ensures holistic player development across all dimensions
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {specialists.map((specialist, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl ${specialist.color} flex items-center justify-center flex-shrink-0`}>
                    {specialist.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{specialist.name}</h3>
                        <p className="text-primary text-sm font-medium">{specialist.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {specialist.experience} years
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{specialist.specialty}</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mt-4">{specialist.description}</p>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2">Qualifications</h4>
                  <div className="flex flex-wrap gap-1">
                    {specialist.qualifications.map((qual, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {qual}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15+</div>
              <div className="text-muted-foreground">Expert Coaches</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100+</div>
              <div className="text-muted-foreground">Years Combined Experience</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">25+</div>
              <div className="text-muted-foreground">Pro Players Developed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4</div>
              <div className="text-muted-foreground">Specialist Departments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Our Team CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join Our Team
          </h2>
          <p className="text-foreground/80 max-w-2xl mx-auto mb-8">
            We're always looking for passionate coaches and specialists to join our mission of developing future football stars.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-xl">
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
            </Button>
            <Button variant="outline" className="border-white text-foreground hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl">
              <Linkedin className="w-5 h-5 mr-2" />
              LinkedIn
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Future Stars Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
