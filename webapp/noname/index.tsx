import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, MapPin, Phone, Star } from "lucide-react";
import React from "react";

const Screen = (): JSX.Element => {
  const statsData = [
    {
      number: "500+",
      label: "успешных клиентов",
      description:
        "Мы работали с крупными компаниями и личными брендами, создавая решения, которые приносят результат.",
      icon: "👥",
    },
    {
      number: "15+",
      label: "лет опыта",
      description:
        "Команда дизайнеров, маркетологов и разработчиков с проверенным опытом",
      icon: "⏰",
    },
    {
      number: "",
      label: "Партнерство с фондами",
      description:
        "Мы поддерживаем благотворительные инициативы: Фонд защиты детей и «СЕМЕЙНАЯ СКАЗКА»",
      icon: "🤝",
    },
  ];

  const testimonialData = {
    name: "Оксана Л.",
    tag: "#презентация",
    text: "Приехала в студию дизайна New, чтобы они мне оформили презентацию на тему трендов моды (так как я шью премиум одежду на заказ и выступаю на конференциях). Ребята с первого раза все сделали идеально и мое выступление на конференции прошло отлично! Буду к ним и дальше обращаться, ребята молодцы)",
    rating: 5,
  };

  const contactData = [
    {
      icon: Phone,
      text: "+7 (911) 184-80-08",
    },
    {
      icon: Mail,
      text: "info@newdigital.moscow",
    },
    {
      icon: MapPin,
      text: "Москва, Армянский переулок, 11/2А, 101000",
    },
  ];

  const socialLinks = [
    {
      name: "Telegram",
      bgColor: "bg-[#00a9e0]",
      icon: "📱",
    },
    {
      name: "WhatsApp",
      bgColor: "bg-[#62e200]",
      icon: "💬",
    },
  ];

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white overflow-hidden w-[375px] min-h-screen relative">
        {/* Hero Section */}
        <section className="relative w-full h-[419px] mt-3.5">
          <img
            className="absolute w-[375px] h-[257px] top-[34px] left-0"
            alt="Hero background"
            src=""
          />

          <div className="absolute w-full h-[157px] top-[214px] left-0">
            <div className="w-[375px] h-[157px] bg-gradient-to-b from-transparent to-purple-100 rounded-b-3xl" />
          </div>

          <img
            className="absolute w-[85px] h-[55px] top-0 left-[31px] object-cover"
            alt="Logo"
            src=""
          />

          <div className="absolute w-[356px] h-[135px] top-[284px] left-[25px] text-center">
            <h1 className="w-[234px] h-[30px] mx-auto [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-4xl leading-[29.9px] mb-2">
              Брендинг
            </h1>
            <h2 className="w-[156px] h-[30px] mx-auto [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-4xl leading-[29.9px] mb-2">
              Сайты
            </h2>
            <h3 className="w-[268px] h-[30px] mx-auto [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-4xl leading-[29.9px] mb-4">
              Маркетинг
            </h3>
            <p className="w-[229px] h-[22px] mx-auto [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[17px] text-center leading-[21.9px]">
              Скорость. Эстетика. Смысл
            </p>
          </div>

          <div className="absolute w-[93px] h-[93px] top-[265px] right-[12px]">
            <div className="relative w-[87px] h-[85px] top-1 left-[3px]">
              <div className="absolute w-[55px] h-[55px] top-[15px] left-4 bg-[#9272e6cc] rounded-[27.5px] backdrop-blur-[0.73px]" />
              <Button
                size="icon"
                className="absolute w-[87px] h-[85px] top-0 left-0 rounded-full bg-transparent hover:bg-transparent p-0"
              >
                <ArrowRight className="w-[34px] h-[34px] text-white" />
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 px-[33px] mt-8">
          <Button className="w-full h-auto py-4 rounded-[32.79px] bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-[0px_1.46px_5.47px_#0b001e40]">
            <span className="text-[23px] mr-2">Заказать</span>
            <ArrowRight className="w-[30px] h-[30px]" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-4 rounded-[32.79px] border-gray-300"
          >
            <span className="text-[23px] text-[#181818] mr-2">Позвонить</span>
            <ArrowRight className="w-[30px] h-[30px] text-[#181818]" />
          </Button>
        </div>

        {/* Main Heading */}
        <div className="px-[27px] mt-12">
          <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[28px] leading-[29.9px] text-cb-7-ehy text-center">
            Мы любим свое дело и дорожим репутацией
          </h2>
        </div>

        {/* Stats Section */}
        <section className="px-2 mt-12 space-y-4">
          {statsData.map((stat, index) => (
            <Card
              key={index}
              className="mx-auto w-[372px] h-[171px] bg-gradient-to-r from-purple-50 to-purple-100 border-0 rounded-3xl"
            >
              <CardContent className="p-0 relative h-full">
                <div className="absolute w-[60px] h-[60px] top-0 left-[18px] bg-[#9272e6cc] rounded-[30px] backdrop-blur-[0.73px] flex items-center justify-center">
                  <span className="text-2xl">{stat.icon}</span>
                </div>

                <div className="absolute w-[330px] h-[124px] top-[21px] left-[18px]">
                  {stat.number && (
                    <div className="h-[22px] left-[90px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-[22px] leading-[21.9px] absolute">
                      {stat.number}
                    </div>
                  )}
                  <div className="h-[17px] top-[27px] left-[90px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-[17px] leading-[16.8px] absolute">
                    {stat.label}
                  </div>
                  <p className="w-[324px] top-[58px] left-0 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-base leading-[21.9px] absolute">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Recommendations Section */}
        <div className="px-[29px] mt-12">
          <div className="flex items-center justify-center gap-4">
            <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-[28px] text-center leading-[29.9px]">
              Нас рекомендуют
            </h2>
            <div className="w-[49px] h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>

          <div className="flex items-center justify-center mt-4 gap-2">
            <div className="flex gap-1">
              <div className="w-7 h-7 bg-[#9272e6] rounded-[14px]" />
              <div className="w-7 h-7 bg-[#c1aafb] rounded-[14px]" />
              <div className="w-7 h-7 bg-[#eceaf4] rounded-[14px]" />
            </div>
            <span className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-sm leading-[21.9px] ml-2">
              500+
            </span>
          </div>
        </div>

        {/* Testimonial Section */}
        <section className="px-2 mt-12">
          <Card className="w-[306px] h-[321px] mx-auto bg-gradient-to-b from-purple-50 to-white border-0 rounded-3xl relative">
            <CardContent className="p-0 relative h-full">
              <Avatar className="absolute w-[47px] h-[47px] top-[7px] left-1/2 transform -translate-x-1/2">
                <AvatarImage src="" alt="Оксана Л." />
                <AvatarFallback>ОЛ</AvatarFallback>
              </Avatar>

              <div className="w-[266px] h-[241px] absolute top-[61px] left-[23px] text-center">
                <h3 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-base leading-[20.1px] mb-1">
                  {testimonialData.name}
                </h3>

                <Badge
                  variant="secondary"
                  className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#353535] text-xs mb-6"
                >
                  {testimonialData.tag}
                </Badge>

                <p className="w-[260px] h-[150px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-xs text-center leading-[18.7px] mb-4">
                  {testimonialData.text}
                </p>

                <div className="flex justify-center gap-1">
                  {[...Array(testimonialData.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-[21px] h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Yandex Maps Button */}
        <div className="px-[34px] mt-8">
          <Button className="w-full h-auto py-4 rounded-[32.79px] bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-[0px_1.46px_5.47px_#0b001e40]">
            <span className="text-[23px] mr-2">Смотреть на Яндекс.Картах</span>
            <img className="w-[17px] h-[21px]" alt="Yandex Maps" src="" />
          </Button>
        </div>

        {/* Projects Section */}
        <section className="px-[29px] mt-12">
          <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-[28px] text-center leading-[29.9px] mb-8">
            Наши проекты
          </h2>

          <div className="relative">
            <img
              className="w-60 h-[484px] mx-auto object-cover rounded-lg"
              alt="Project showcase"
              src=""
            />

            <Button
              variant="outline"
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-[24.87px] h-auto py-3 px-6"
            >
              <span className="text-lg text-[#181818] mr-2">Смотреть</span>
              <ArrowRight className="w-6 h-6 text-[#181818]" />
            </Button>
          </div>
        </section>

        {/* Contact Section */}
        <section className="px-5 mt-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-[47px] h-[49px] bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📞</span>
            </div>
            <h2 className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-[28px] text-center leading-[29.9px]">
              Связаться с нами
            </h2>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <Button
              variant="outline"
              className="w-full h-auto py-4 rounded-[32.79px] border-gray-300"
            >
              <span className="text-[23px] text-[#181818] mr-2">Позвонить</span>
              <ArrowRight className="w-[30px] h-[30px] text-[#181818]" />
            </Button>

            <Button className="w-full h-auto py-4 rounded-[32.79px] bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-[0px_1.46px_5.47px_#0b001e40]">
              <span className="text-[23px] mr-2">Оставить заявку</span>
              <ArrowRight className="w-[30px] h-[30px]" />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 mb-8">
            {contactData.map((contact, index) => (
              <div key={index} className="flex items-center gap-4">
                <contact.icon className="w-[19px] h-[19px] text-cb-7-ehy" />
                <span className="[font-family:'Benzin-Medium-☞',Helvetica] font-normal text-cb-7-ehy text-[15px] leading-[21.9px]">
                  {contact.text}
                </span>
              </div>
            ))}
          </div>

          {/* Map Image */}
          <img
            className="w-[335px] h-[291px] mx-auto object-cover rounded-lg mb-8"
            alt="Location map"
            src=""
          />

          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-8">
            {socialLinks.map((social, index) => (
              <Button
                key={index}
                size="icon"
                className={`w-[60px] h-[60px] ${social.bgColor} rounded-[30px] hover:opacity-80`}
              >
                <span className="text-2xl">{social.icon}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full h-[137px] bg-black flex flex-col items-center justify-center gap-4">
          <a
            href="#"
            className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-base leading-[21.9px] underline"
          >
            Договор-офферты
          </a>
          <a
            href="#"
            className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-base leading-[21.9px] underline"
          >
            Политика конфиденциальности
          </a>
        </footer>
      </div>
    </div>
  );
};

export default Screen;
