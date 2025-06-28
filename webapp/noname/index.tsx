import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import React from "react";

export default function PropertyDefaultSubsection(): JSX.Element {
  // Hero section data
  const heroText = {
    mainHeadings: ["Брендинг", "Сайты", "Маркетинг"],
    tagline: "Скорость. Эстетика. Смысл",
  };

  // Stats data
  const stats = [
    {
      number: "500+",
      title: "успешных клиентов",
      description:
        "Мы работали с крупными компаниями и личными брендами, создавая решения, которые приносят результат.",
    },
    {
      number: "15+",
      title: "лет опыта",
      description:
        "Команда дизайнеров, маркетологов и разработчиков с проверенным опытом",
    },
    {
      title: "Партнерство с фондами",
      description:
        "Мы поддерживаем благотворительные инициативы: Фонд защиты детей и «СЕМЕЙНАЯ СКАЗКА»",
    },
  ];

  // Testimonial data
  const testimonial = {
    name: "Оксана Л.",
    tag: "#презентация",
    text: "Приехала в студию дизайна New, чтобы они мне оформили презентацию на тему трендов моды (так как я шью премиум одежду на заказ и выступаю на конференциях).  Ребята с первого раза все сделали идеально и мое выступление на конференции прошло отлично! Буду к ним и дальше обращаться, ребята молодцы)",
  };

  // Contact info data
  const contactInfo = [
    {
      icon: <Phone className="w-[52px] h-[52px]" />,
      text: "+7 (911) 184-80-08",
    },
    {
      icon: <Mail className="w-[52px] h-9 mt-[5px]" />,
      text: "info@newdigital.moscow",
    },
    {
      icon: <MapPin className="w-[52px] h-[52px]" />,
      text: "Москва, Армянский переулок, 11/2А, 101000",
    },
  ];

  // Footer links
  const footerLinks = ["Договор-офферты", "Политика конфиденциальности"];

  return (
    <main className="relative w-full bg-white">
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative w-full">
          {/* Hero Image */}
          <div className="relative w-full h-[706px]">
            <img
              className="w-full h-full object-cover"
              alt="Hero Image"
              src=""
            />
          </div>

          {/* Logo */}
          <div className="absolute top-0 left-20">
            <img
              className="w-[234px] h-[150px] object-cover"
              alt="Logo"
              src=""
            />
          </div>

          {/* Hero Text Overlay */}
          <div className="absolute w-full bottom-0 left-0">
            <div className="bg-[url(/subtract.svg)] bg-[100%_100%] w-full h-[431px]" />
          </div>

          {/* Hero Text Content */}
          <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 w-[961px] text-center">
            {heroText.mainHeadings.map((heading, index) => (
              <h1
                key={`heading-${index}`}
                className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[100px] leading-[82px] tracking-[0] mb-6"
              >
                {heading}
              </h1>
            ))}
            <p className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] leading-[60px] tracking-[0] mt-8">
              {heroText.tagline}
            </p>
          </div>

          {/* Play Button */}
          <div className="absolute bottom-[100px] right-[100px] w-[246px] h-[246px]">
            <div className="relative w-[231px] h-[225px] top-[11px] left-2">
              <div className="absolute w-[142px] h-[142px] top-[42px] left-11 bg-[#9272e6cc] rounded-[71px] backdrop-blur-[2px]"></div>
              <img
                className="w-[231px] h-[225px] absolute left-0 top-0"
                alt="Play button"
                src=""
              />
              <ArrowRight className="absolute w-24 h-24 top-[65px] left-[67px] text-white" />
            </div>
          </div>

          {/* Group Image */}
          <div className="absolute bottom-[20px] left-20">
            <img className="w-[127px] h-[133px]" alt="Group" src="" />
          </div>
        </div>
      </section>

      {/* CTA Buttons Section */}
      <section className="flex flex-col items-center gap-6 my-10">
        <Button className="w-[840px] h-[200px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black hover:bg-black/90">
          <div className="flex items-center justify-center">
            <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[normal]">
              Заказать
            </span>
            <ArrowRight className="w-[85px] h-[85px] ml-4" />
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-[840px] h-[200px] rounded-[90px] border-2 border-gray-200"
        >
          <div className="flex items-center justify-center">
            <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-[normal]">
              Позвонить
            </span>
            <ArrowRight className="w-[85px] h-[85px] ml-4" />
          </div>
        </Button>
      </section>

      {/* Tagline Section */}
      <section className="my-20">
        <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] tracking-[0] w-[873px] mx-auto">
          Мы любим свое дело и дорожим репутацией
        </h2>
      </section>

      {/* Stats Section */}
      <section className="flex flex-col gap-12 my-20">
        {stats.map((stat, index) => (
          <Card
            key={`stat-${index}`}
            className="w-[1020px] h-[470px] mx-auto border-none"
          >
            <CardContent className="p-0 relative h-full">
              <div className="absolute w-[162px] h-[162px] top-0 left-12 bg-[#9272e6cc] rounded-[81px] backdrop-blur-[2px]"></div>
              <img
                className="w-full h-full absolute top-0 left-0"
                alt={`Stat background ${index + 1}`}
                src=""
              />

              <div className="absolute top-[57px] left-[50px] w-[895px]">
                {stat.number && (
                  <h3 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-6xl leading-[60px] tracking-[0] ml-[248px]">
                    {stat.number}
                  </h3>
                )}
                <h4 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[46px] leading-[46px] tracking-[0] ml-[248px] mt-[14px]">
                  {stat.title}
                </h4>
                <p className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] leading-[60px] tracking-[0] mt-[50px]">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recommendations Section */}
      <section className="my-20">
        <div className="relative w-[873px] h-[228px] mx-auto">
          <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] tracking-[0] mt-16">
            Нас рекомендуют
          </h2>
          <img
            className="absolute w-[132px] h-[130px] top-0 right-[112px]"
            alt="Recommendation icon"
            src=""
          />
        </div>

        {/* Recommendation Circles */}
        <div className="flex justify-center my-10">
          <div className="flex gap-4">
            <div className="w-[77px] h-[77px] bg-[#9272e6] rounded-[38.5px]"></div>
            <div className="w-[77px] h-[77px] bg-[#c1aafb] rounded-[38.5px]"></div>
            <div className="w-[77px] h-[77px] bg-[#eceaf4] rounded-[38.5px]"></div>
            <span className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-[40px] leading-[60px] ml-5">
              500+
            </span>
          </div>
        </div>

        {/* Testimonial Card */}
        <Card className="w-[920px] h-[960px] mx-auto border-none bg-[url(/union.svg)] bg-[100%_100%]">
          <CardContent className="p-0 relative h-full">
            <div className="absolute top-5 left-1/2 -translate-x-1/2">
              <img
                className="w-[142px] h-[142px] rounded-full"
                alt="User avatar"
                src=""
              />
            </div>

            <div className="pt-[181px] px-[50px] text-center">
              <h3 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[46px] leading-[60px] tracking-[0]">
                {testimonial.name}
              </h3>

              <div className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#353535] text-4xl text-center leading-[56px] tracking-[0] mt-2">
                {testimonial.tag}
              </div>

              <p className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-4xl text-center tracking-[0] leading-[56px] mt-10">
                {testimonial.text}
              </p>

              {/* Star Rating */}
              <div className="flex justify-center mt-16">
                {[1, 2, 3, 4, 5].map((star) => (
                  <img
                    key={`star-${star}`}
                    className="w-16 h-[61px]"
                    alt={`Star ${star}`}
                    src=""
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Yandex Maps Button */}
        <Button className="w-[840px] h-[200px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black hover:bg-black/90 mx-auto block my-20">
          <div className="flex items-center justify-center">
            <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[70.4px]">
              &nbsp;&nbsp; Смотреть на Яндекс.Картах
            </span>
            <img
              className="w-[46px] h-[57px] ml-4"
              alt="Yandex Maps logo"
              src=""
            />
          </div>
        </Button>
      </section>

      {/* Projects Section */}
      <section className="my-20">
        <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center tracking-[0] leading-[82px] mb-10">
          Наши проекты
        </h2>

        <div className="w-[664px] h-[1340px] mx-auto">
          <img className="w-full h-full" alt="Projects showcase" src="" />
        </div>

        <Button
          variant="outline"
          className="w-[642px] h-[153px] rounded-[68.79px] mx-auto block my-10"
        >
          <div className="flex items-center justify-center">
            <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[49px] text-center leading-[normal]">
              Смотреть
            </span>
            <ArrowRight className="w-[65px] h-[65px] ml-4" />
          </div>
        </Button>
      </section>

      {/* Contact Section */}
      <section className="my-20">
        <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] tracking-[0] mb-10">
          Связаться с нами
        </h2>

        <div className="absolute left-[107px]">
          <img className="w-[127px] h-[133px]" alt="Group" src="" />
        </div>

        <div className="flex flex-col gap-6 items-center my-10">
          <Button className="w-[840px] h-[200px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black hover:bg-black/90">
            <div className="flex items-center justify-center">
              <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[normal]">
                Оставить заявку
              </span>
              <ArrowRight className="w-[85px] h-[85px] ml-4" />
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-[840px] h-[200px] rounded-[90px] border-2 border-gray-200"
          >
            <div className="flex items-center justify-center">
              <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-[normal]">
                Позвонить
              </span>
              <ArrowRight className="w-[85px] h-[85px] ml-4" />
            </div>
          </Button>
        </div>

        {/* Contact Information */}
        <div className="my-10">
          {contactInfo.map((info, index) => (
            <div
              key={`contact-${index}`}
              className={`flex items-start ${index === 2 ? "mt-20" : "mb-6"}`}
            >
              <div className="ml-20">{info.icon}</div>
              <p className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[40px] tracking-[0] leading-[60px] ml-[72px]">
                {info.text}
              </p>
            </div>
          ))}
        </div>

        {/* Map Image */}
        <div className="w-[920px] h-[800px] mx-auto my-10">
          <img className="w-full h-full object-cover" alt="Map" src="" />
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center gap-10 my-10">
          <div className="w-[162px] h-[162px] bg-[#00a9e0] rounded-[81px] flex items-center justify-center">
            <img className="w-[81px] h-[69px]" alt="Social media icon" src="" />
          </div>
          <div className="w-[162px] h-[162px] bg-[#62e200] rounded-[81px] flex items-center justify-center">
            <img className="w-[81px] h-[81px]" alt="Social media icon" src="" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full h-[375px] bg-black flex flex-col items-center justify-center">
        {footerLinks.map((link, index) => (
          <a
            key={`footer-${index}`}
            href="#"
            className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-[46px] leading-[60px] underline tracking-[0] mb-16"
          >
            {link}
          </a>
        ))}
      </footer>
    </main>
  );
}
