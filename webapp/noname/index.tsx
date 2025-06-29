import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, MapPin, Phone, Star } from "lucide-react";
import React from "react";

export default function PropertyDefault(): JSX.Element {
  // Data for the main sections
  const mainServices = [
    { text: "Брендинг", className: "w-[642px]" },
    { text: "Сайты", className: "w-[464px]" },
    { text: "Маркетинг", className: "w-[736px]" },
  ];

  // Data for the achievement cards
  const achievements = [
    {
      title: "500+",
      subtitle: "успешных клиентов",
      description:
        "Мы работали с крупными компаниями и личными брендами, создавая решения, которые приносят результат.",
      icon: "group2",
    },
    {
      title: "15+",
      subtitle: "лет опыта",
      description:
        "Команда дизайнеров, маркетологов и разработчиков с проверенным опытом",
      icon: "layer-93",
    },
    {
      title: "",
      subtitle: "Партнерство\nс фондами",
      description:
        "Мы поддерживаем благотворительные инициативы: Фонд защиты детей и «СЕМЕЙНАЯ СКАЗКА»",
      icon: "group3",
    },
  ];

  // Data for contact information
  const contactInfo = [
    {
      icon: <Phone className="w-[52px] h-[52px]" />,
      text: "+7 (911) 184-80-08",
      className: "w-[549px]",
    },
    {
      icon: <Mail className="w-[52px] h-9 mt-[5px]" />,
      text: "info@newdigital.moscow",
      className: "w-[668px]",
    },
    {
      icon: <MapPin className="w-[52px] h-[52px]" />,
      text: "Москва, Армянский переулок, 11/2А, 101000",
      className: "w-[914px]",
    },
  ];

  // Social media icons
  const socialMedia = [
    { color: "bg-[#00a9e0]", icon: "vector3" },
    { color: "bg-[#62e200]", icon: "vector4" },
  ];

  // Footer links
  const footerLinks = [
    { text: "Договор-офферты", className: "left-[338px]" },
    { text: "Политика конфиденциальности", className: "left-[191px]" },
  ];

  return (
    <div className="relative w-[1080px] h-[10055px] bg-white">
      {/* Hero Section */}
      <div className="absolute w-[1080px] h-[1131px] top-[37px] left-0">
        <img
          className="absolute w-[1080px] h-[706px] top-[78px] left-0"
          alt="Image"
          src=""
        />

        <div className="absolute w-[1080px] h-[431px] top-[572px] left-0 bg-[url(/subtract.svg)] bg-[100%_100%]" />

        <img
          className="absolute w-[234px] h-[150px] top-0 left-20 object-cover"
          alt="Element"
          src=""
        />

        <div className="absolute w-[961px] h-[369px] top-[762px] left-[68px]">
          {mainServices.map((service, index) => (
            <div
              key={`service-${index}`}
              className={`${service.className} h-[82px] ${index === 0 ? "top-0 left-0" : index === 1 ? "top-[107px] left-[219px]" : "top-[214px] left-[217px]"} [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[100px] text-center leading-[82px] absolute tracking-[0]`}
            >
              {service.text}
            </div>
          ))}

          <div className="w-[628px] h-[60px] top-[309px] left-[241px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] text-center leading-[60px] absolute tracking-[0]">
            Скорость. Эстетика. Смысл
          </div>
        </div>

        <img
          className="absolute w-[127px] h-[133px] top-[979px] left-20"
          alt="Group"
          src=""
        />

        <div className="absolute w-[246px] h-[246px] top-[718px] left-[743px]">
          <div className="relative w-[231px] h-[225px] top-[11px] left-2">
            <div className="absolute w-[142px] h-[142px] top-[42px] left-11 bg-[#9272e6cc] rounded-[71px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)]" />

            <img
              className="absolute w-[231px] h-[225px] top-0 left-0"
              alt="Image"
              src=""
            />

            <ArrowRight className="absolute w-24 h-24 top-[65px] left-[67px]" />

            <div className="absolute w-[5px] h-[5px] top-[110px] left-[7px] bg-black rounded-[2.5px]" />
            <div className="absolute w-[5px] h-[5px] top-[110px] left-[217px] bg-black rounded-[2.5px]" />
          </div>
        </div>
      </div>

      {/* Main Heading */}
      <div className="w-[873px] h-[246px] top-[1834px] left-[100px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[76px] text-center leading-[82px] absolute tracking-[0]">
        Мы любим свое дело и дорожим репутацией
      </div>

      {/* Recommendations Heading */}
      <div className="absolute w-[873px] h-[228px] top-[3746px] left-[104px]">
        <div className="w-[873px] h-[164px] top-16 left-0 [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[76px] text-center leading-[82px] absolute tracking-[0]">
          Нас рекомендуют
        </div>

        <img
          className="absolute w-[132px] h-[130px] top-0 left-[629px]"
          alt="Group"
          src=""
        />
      </div>

      {/* Projects Heading */}
      <div className="w-[873px] h-[82px] top-[5491px] left-[104px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[76px] text-center leading-[82px] absolute tracking-[0]">
        Наши проекты
      </div>

      {/* Contact Us Heading */}
      <div className="w-[587px] h-[164px] top-[7271px] left-[246px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[76px] text-center leading-[82px] absolute tracking-[0]">
        Связаться с нами
      </div>

      {/* Order Button */}
      <Button className="absolute w-[840px] h-[200px] top-[1288px] left-[113px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black text-white h-auto">
        <div className="relative w-[389px] h-[100px] flex items-center justify-center">
          <div className="w-[289px] h-[87px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[normal]">
            Заказать
          </div>
          <ArrowRight className="w-[85px] h-[85px] ml-5" />
        </div>
      </Button>

      {/* Achievement Cards */}
      {achievements.map((achievement, index) => (
        <Card
          key={`achievement-${index}`}
          className="absolute w-[1020px] h-[470px] top-[${2161 + index * 530}px] left-[${index === 2 ? 31 : 30}px] border-0 shadow-none"
        >
          <CardContent className="relative h-[470px] p-0">
            <div className="absolute w-[162px] h-[162px] top-0 left-12 bg-[#9272e6cc] rounded-[81px] backdrop-blur-[2px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(2px)_brightness(100%)]" />

            <img
              className="absolute w-[1020px] h-[470px] top-0 left-0"
              alt="Subtract"
              src=""
            />

            <div className="absolute w-[895px] h-[339px] top-[57px] left-[50px]">
              {achievement.subtitle && (
                <div className="h-[46px] top-[74px] left-[248px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[46px] leading-[46px] whitespace-nowrap absolute tracking-[0]">
                  {achievement.subtitle}
                </div>
              )}

              {achievement.title && (
                <div className="h-[60px] top-0 left-[248px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-6xl leading-[60px] whitespace-nowrap absolute tracking-[0]">
                  {achievement.title}
                </div>
              )}

              <div
                className={`${index === 0 ? "w-[889px] h-[180px] top-[159px]" : index === 1 ? "w-[889px] h-[120px] top-[171px]" : "w-[920px] h-[180px] top-[161px]"} left-0 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] leading-[60px] absolute tracking-[0]`}
              >
                {achievement.description}
              </div>
            </div>

            <img
              className={`absolute ${index === 0 ? "w-[52px] h-[50px] top-14 left-[103px]" : index === 1 ? "w-[43px] h-[43px] top-[59px] left-[107px]" : "w-[53px] h-[46px] top-[58px] left-[103px]"}`}
              alt="Group"
              src=""
            />
          </CardContent>
        </Card>
      ))}

      {/* Call Button */}
      <Button
        variant="outline"
        className="absolute w-[840px] h-[200px] top-[1518px] left-[120px] rounded-[90px] border-0 h-auto"
      >
        <div className="relative w-[447px] h-[98px] flex items-center justify-center">
          <div className="w-[346px] h-[87px] [font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-[normal]">
            Позвонить
          </div>
          <ArrowRight className="w-[85px] h-[85px] ml-3" />
        </div>
      </Button>

      {/* Second Call Button */}
      <Button
        variant="outline"
        className="absolute w-[840px] h-[200px] top-[7746px] left-[120px] rounded-[90px] border-0 h-auto"
      >
        <div className="relative w-[447px] h-[98px] flex items-center justify-center">
          <div className="w-[346px] h-[87px] [font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-[normal]">
            Позвонить
          </div>
          <ArrowRight className="w-[85px] h-[85px] ml-3" />
        </div>
      </Button>

      <img
        className="absolute w-[127px] h-[133px] top-[7303px] left-[107px]"
        alt="Group"
        src=""
      />

      {/* Rating Indicator */}
      <div className="absolute w-[349px] h-[77px] top-[4005px] left-[367px]">
        <div className="absolute w-[193px] h-[77px] top-0 left-0 flex">
          <div className="absolute w-[77px] h-[77px] top-0 left-0 bg-[#9272e6] rounded-[38.5px]" />
          <div className="absolute w-[77px] h-[77px] top-0 left-14 bg-[#c1aafb] rounded-[38.5px]" />
          <div className="absolute w-[77px] h-[77px] top-0 left-[116px] bg-[#eceaf4] rounded-[38.5px]" />
        </div>

        <div className="h-[60px] top-3 left-[212px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-[40px] leading-[60px] whitespace-nowrap absolute tracking-[0]">
          500+
        </div>
      </div>

      {/* Yandex Maps Button */}
      <Button className="absolute w-[840px] h-[200px] top-[5172px] left-[120px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black text-white h-auto">
        <div className="relative w-[521px] h-[125px] flex items-center justify-center">
          <div className="w-[461px] h-[119px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[70.4px]">
            &nbsp;&nbsp; Смотреть на Яндекс.Картах
          </div>
          <img className="w-[46px] h-[57px] ml-3" alt="Logo yamaps" src="" />
        </div>
      </Button>

      {/* Testimonial Card */}
      <Card className="absolute w-[920px] h-[960px] top-[4142px] left-[31px] border-0 shadow-none">
        <CardContent className="relative h-[960px] p-0">
          <div className="absolute w-[920px] h-[960px] top-0 left-0 bg-[url(/union.svg)] bg-[100%_100%]">
            <div className="relative w-[826px] h-[721px] top-[181px] left-[50px]">
              <div className="h-[60px] top-0 left-[267px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[46px] leading-[60px] whitespace-nowrap absolute tracking-[0]">
                Оксана Л.
              </div>

              <div className="absolute w-[820px] h-[448px] top-[140px] left-0 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-4xl text-center tracking-[0] leading-[56px]">
                Приехала в студию дизайна New, чтобы они мне оформили
                презентацию на тему трендов моды (так как я шью премиум одежду
                на заказ и выступаю на конференциях).&nbsp;&nbsp;Ребята с
                первого раза все сделали идеально и мое выступление на
                конференции прошло отлично! Буду к ним и дальше обращаться,
                ребята молодцы)
              </div>

              <Badge className="w-[275px] h-14 top-[67px] left-[272px] [font-family:'Helvetica-Bold',Helvetica] font-bold text-[#353535] text-4xl text-center leading-[56px] absolute tracking-[0] bg-transparent">
                #презентация
              </Badge>

              <div className="absolute w-[406px] h-[72px] top-[649px] left-[207px] flex">
                {[1, 2, 3, 4, 5].map((_, index) => (
                  <Star
                    key={`star-${index}`}
                    className={`left-[${index * 84 + 4}px] absolute w-16 h-[61px] top-0.5 fill-current text-yellow-400`}
                  />
                ))}
              </div>
            </div>
          </div>

          <img
            className="absolute w-[142px] h-[142px] top-5 left-[389px] rounded-full"
            alt="Mask group"
            src=""
          />
        </CardContent>
      </Card>

      {/* Submit Application Button */}
      <Button className="absolute w-[840px] h-[200px] top-[7516px] left-[120px] rounded-[90px] shadow-[0px_4px_15px_#0b001e40] bg-black text-white h-auto">
        <div className="relative w-[611px] h-[99px] flex items-center justify-center">
          <div className="w-[512px] h-[87px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[normal]">
            Оставить заявку
          </div>
          <ArrowRight className="w-[85px] h-[85px] ml-3" />
        </div>
      </Button>

      {/* View Button */}
      <Button
        variant="outline"
        className="absolute w-[642px] h-[153px] top-[6999px] left-20 rounded-[68.79px] border-0 h-auto"
      >
        <div className="relative w-[319px] h-[75px] flex items-center justify-center">
          <div className="w-[239px] h-[67px] [font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[49px] text-center leading-[normal]">
            Смотреть
          </div>
          <ArrowRight className="w-[65px] h-[65px] ml-3" />
        </div>
      </Button>

      {/* Project Image */}
      <img
        className="absolute w-[664px] h-[1340px] top-[5635px] left-[70px]"
        alt="Element"
        src=""
      />

      {/* Map Image */}
      <img
        className="absolute w-[920px] h-[800px] top-[8323px] left-20 object-cover"
        alt="Rectangle"
        src=""
      />

      {/* Contact Information */}
      {contactInfo.map((contact, index) => (
        <div
          key={`contact-${index}`}
          className={`absolute ${contact.className} h-[60px] top-[${index === 0 ? 8076 : index === 1 ? 8183 : 9178}px] left-[${index === 2 ? 78 : 81}px] flex items-center`}
        >
          <div className="absolute left-0">{contact.icon}</div>
          <div
            className={`absolute ${index === 2 ? "w-[840px]" : index === 1 ? "w-[594px]" : "w-[474px]"} h-[60px] top-0 left-[${index === 1 ? 72 : index === 2 ? 72 : 73}px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-u-3kc-1t text-[40px] tracking-[0] leading-[60px]`}
          >
            {contact.text}
          </div>
        </div>
      ))}

      {/* Social Media Icons */}
      <div className="absolute w-[364px] h-[162px] top-[9418px] left-[358px] flex space-x-10">
        {socialMedia.map((social, index) => (
          <div
            key={`social-${index}`}
            className={`absolute w-[162px] h-[162px] top-0 left-[${index * 202}px] ${social.color} rounded-[81px] flex items-center justify-center`}
          >
            <img
              className={`w-[81px] h-[${index === 0 ? 69 : 81}px]`}
              alt="Vector"
              src=""
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute w-[1080px] h-[375px] top-[9680px] left-0 bg-black flex flex-col items-center justify-center">
        {footerLinks.map((link, index) => (
          <div
            key={`footer-${index}`}
            className={`h-[60px] top-[${index === 0 ? 79 : 203}px] ${link.className} [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-[46px] leading-[60px] underline whitespace-nowrap absolute tracking-[0] cursor-pointer`}
          >
            {link.text}
          </div>
        ))}
      </div>
    </div>
  );
}
