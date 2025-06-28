import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import React from "react";

export const PropertySubsection = (): JSX.Element => {
  // Data for the main sections
  const mainSections = [
    { text: "Брендинг", className: "w-[642px]" },
    { text: "Сайты", className: "w-[464px] left-[219px]" },
    { text: "Маркетинг", className: "w-[736px] left-[217px]" },
  ];

  // Data for the info cards
  const infoCards = [
    {
      title: "500+",
      subtitle: "успешных клиентов",
      description:
        "Мы работали с крупными компаниями и личными брендами, создавая решения, которые приносят результат.",
    },
    {
      title: "15+",
      subtitle: "лет опыта",
      description:
        "Команда дизайнеров, маркетологов и разработчиков с проверенным опытом",
    },
    {
      title: "",
      subtitle: "Партнерство\nс фондами",
      description:
        "Мы поддерживаем благотворительные инициативы: Фонд защиты детей и «СЕМЕЙНАЯ СКАЗКА»",
    },
  ];

  // Data for the star rating
  const stars = Array(5).fill(null);

  // Data for contact information
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

  return (
    <div className="relative w-full bg-white">
      {/* Hero Section */}
      <section className="relative w-full">
        <img
          className="w-full h-[706px] object-cover"
          alt="Hero Image"
          src=""
        />

        <div className="absolute w-full h-[431px] bottom-0 left-0 bg-gradient-to-t from-white to-transparent" />

        <img
          className="absolute w-[234px] h-[150px] top-0 left-20 object-cover"
          alt="Logo"
          src=""
        />

        <div className="absolute w-full bottom-[100px] left-0 flex flex-col items-center">
          {mainSections.map((section, index) => (
            <div
              key={`section-${index}`}
              className={`${section.className} h-[82px] mb-6 [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[100px] text-center leading-[82px] tracking-[0]`}
            >
              {section.text}
            </div>
          ))}

          <div className="w-[628px] h-[60px] mt-4 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] text-center leading-[60px] tracking-[0]">
            Скорость. Эстетика. Смысл
          </div>
        </div>

        <div className="absolute bottom-[100px] left-20">
          <img className="w-[127px] h-[133px]" alt="Group" src="" />
        </div>

        <div className="absolute bottom-[150px] right-[100px] w-[246px] h-[246px]">
          <div className="relative w-[231px] h-[225px] top-[11px] left-2">
            <div className="absolute w-[142px] h-[142px] top-[42px] left-11 bg-[#9272e6cc] rounded-[71px] backdrop-blur-[2px]" />
            <img
              className="w-[231px] h-[225px] absolute top-0 left-0"
              alt="Image"
              src=""
            />
            <ArrowRight className="absolute w-24 h-24 top-[65px] left-[67px] text-white" />
          </div>
        </div>
      </section>

      {/* CTA Buttons */}
      <section className="flex flex-col items-center gap-6 mt-10">
        <Button className="w-[840px] h-[200px] rounded-[90px] bg-black shadow-[0px_4px_15px_#0b001e40] flex items-center justify-center">
          <div className="flex items-center">
            <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-normal">
              Заказать
            </span>
            <ArrowRight className="w-[85px] h-[85px] ml-6 text-white" />
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-[840px] h-[200px] rounded-[90px] border-2 flex items-center justify-center"
        >
          <div className="flex items-center">
            <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-normal">
              Позвонить
            </span>
            <ArrowRight className="w-[85px] h-[85px] ml-6 text-black" />
          </div>
        </Button>
      </section>

      {/* Reputation Section */}
      <section className="mt-20 flex flex-col items-center">
        <div className="w-[873px] h-[246px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] tracking-[0]">
          Мы любим свое дело и дорожим репутацией
        </div>

        {/* Info Cards */}
        <div className="mt-10 space-y-8">
          {infoCards.map((card, index) => (
            <Card
              key={`card-${index}`}
              className="w-[1020px] h-[470px] relative overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="absolute w-[162px] h-[162px] top-0 left-12 bg-[#9272e6cc] rounded-[81px] backdrop-blur-[2px]" />

                <div className="absolute w-[895px] h-[339px] top-[57px] left-[50px]">
                  {card.title && (
                    <div className="h-[60px] top-0 left-[248px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-6xl leading-[60px] whitespace-nowrap absolute tracking-[0]">
                      {card.title}
                    </div>
                  )}

                  <div className="h-[46px] top-[74px] left-[248px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[46px] leading-[46px] whitespace-nowrap absolute tracking-[0] whitespace-pre-line">
                    {card.subtitle}
                  </div>

                  <div className="w-[889px] h-auto top-[159px] left-0 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-[46px] leading-[60px] absolute tracking-[0]">
                    {card.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="mt-20 flex flex-col items-center">
        <div className="relative w-[873px] h-[228px]">
          <div className="w-[873px] h-[164px] top-16 left-0 [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] absolute tracking-[0]">
            Нас рекомендуют
          </div>
          <img
            className="absolute w-[132px] h-[130px] top-0 right-[112px]"
            alt="Group"
            src=""
          />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex space-x-4">
            <div className="w-[77px] h-[77px] bg-[#9272e6] rounded-[38.5px]" />
            <div className="w-[77px] h-[77px] bg-[#c1aafb] rounded-[38.5px]" />
            <div className="w-[77px] h-[77px] bg-[#eceaf4] rounded-[38.5px]" />
            <div className="h-[60px] ml-4 mt-3 [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-black text-[40px] leading-[60px] whitespace-nowrap tracking-[0]">
              500+
            </div>
          </div>
        </div>

        {/* Testimonial Card */}
        <Card className="w-[920px] h-[960px] mt-10 bg-white rounded-3xl shadow-md">
          <CardContent className="p-0 relative">
            <img
              className="absolute w-[142px] h-[142px] top-5 left-[389px] rounded-full"
              alt="Profile"
              src=""
            />

            <div className="relative w-[826px] h-[721px] top-[181px] left-[50px]">
              <div className="h-[60px] top-0 left-[267px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[46px] leading-[60px] whitespace-nowrap absolute tracking-[0]">
                Оксана Л.
              </div>

              <div className="w-[275px] h-14 top-[67px] left-[272px] [font-family:'Helvetica-Bold',Helvetica] font-bold text-[#353535] text-4xl text-center leading-[56px] absolute tracking-[0]">
                #презентация
              </div>

              <div className="absolute w-[820px] h-[448px] top-[140px] left-0 [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#353434] text-4xl text-center tracking-[0] leading-[56px]">
                Приехала в студию дизайна New, чтобы они мне оформили
                презентацию на тему трендов моды (так как я шью премиум одежду
                на заказ и выступаю на конференциях).&nbsp;&nbsp;Ребята с
                первого раза все сделали идеально и мое выступление на
                конференции прошло отлично! Буду к ним и дальше обращаться,
                ребята молодцы)
              </div>

              <div className="absolute w-[406px] h-[72px] top-[649px] left-[207px] flex">
                {stars.map((_, index) => (
                  <img
                    key={`star-${index}`}
                    className="w-16 h-[61px] mx-2"
                    alt={`Star ${index + 1}`}
                    src=""
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Map Section */}
      <section className="mt-20 flex flex-col items-center">
        <Button className="w-[840px] h-[200px] rounded-[90px] bg-black shadow-[0px_4px_15px_#0b001e40] flex items-center justify-center">
          <div className="flex items-center">
            <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-[70.4px]">
              &nbsp;&nbsp; Смотреть на Яндекс.Картах
            </span>
            <img className="w-[46px] h-[57px] ml-4" alt="Logo yamaps" src="" />
          </div>
        </Button>
      </section>

      {/* Projects Section */}
      <section className="mt-20 flex flex-col items-center">
        <div className="w-[873px] h-[82px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center tracking-[0] leading-[82px]">
          Наши проекты
        </div>

        <img className="w-[664px] h-[1340px] mt-10" alt="Projects" src="" />

        <Button
          variant="outline"
          className="w-[642px] h-[153px] mt-6 rounded-[68.79px] border-2 flex items-center justify-center"
        >
          <div className="flex items-center">
            <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[49px] text-center leading-normal">
              Смотреть
            </span>
            <ArrowRight className="w-[65px] h-[65px] ml-4 text-black" />
          </div>
        </Button>
      </section>

      {/* Contact Section */}
      <section className="mt-20 flex flex-col items-center">
        <div className="w-[587px] h-[164px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[76px] text-center leading-[82px] tracking-[0]">
          Связаться с нами
        </div>

        <div className="mt-10 space-y-6">
          {contactInfo.map((info, index) => (
            <div key={`contact-${index}`} className="flex items-start">
              {info.icon}
              <div className="ml-[72px] [font-family:'Benzin-Medium-☞',Helvetica] font-normal text-[#181818] text-[40px] tracking-[0] leading-[60px]">
                {info.text}
              </div>
            </div>
          ))}
        </div>

        <img
          className="w-[920px] h-[800px] mt-10 object-cover"
          alt="Map"
          src=""
        />

        <div className="mt-10 flex justify-center space-x-10">
          <div className="w-[162px] h-[162px] bg-[#00a9e0] rounded-[81px] flex items-center justify-center">
            <img className="w-[81px] h-[69px]" alt="Social Icon 1" src="" />
          </div>
          <div className="w-[162px] h-[162px] bg-[#62e200] rounded-[81px] flex items-center justify-center">
            <img className="w-[81px] h-[81px]" alt="Social Icon 2" src="" />
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <Button className="w-[840px] h-[200px] rounded-[90px] bg-black shadow-[0px_4px_15px_#0b001e40] flex items-center justify-center">
            <div className="flex items-center">
              <span className="[font-family:'Helvetica-Regular',Helvetica] font-normal text-white text-[64px] text-center leading-normal">
                Оставить заявку
              </span>
              <ArrowRight className="w-[85px] h-[85px] ml-4 text-white" />
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-[840px] h-[200px] rounded-[90px] border-2 flex items-center justify-center"
          >
            <div className="flex items-center">
              <span className="[font-family:'Helvetica-Bold',Helvetica] font-bold text-[#181818] text-[64px] text-center leading-normal">
                Позвонить
              </span>
              <ArrowRight className="w-[85px] h-[85px] ml-4 text-black" />
            </div>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full h-[375px] mt-20 bg-black flex flex-col items-center justify-center">
        <a
          href="#"
          className="h-[60px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-[46px] leading-[60px] underline tracking-[0] mb-16"
        >
          Договор-офферты
        </a>
        <a
          href="#"
          className="h-[60px] [font-family:'Helvetica-Regular',Helvetica] font-normal text-[#ffffffcc] text-[46px] leading-[60px] underline tracking-[0]"
        >
          Политика конфиденциальности
        </a>
      </footer>
    </div>
  );
};

export default PropertySubsection;
