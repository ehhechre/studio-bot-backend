import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Phone, MessageCircle, MapPin, Users, Award, Briefcase } from "lucide-react"
import Image from "next/image"

export default function TelegramMiniApp() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Team Photo */}
      <div className="relative bg-gradient-to-b from-purple-50 to-white px-4 pt-6 pb-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">polli digital</h1>
          </div>

          {/* Team Photo */}
          <div className="relative w-full max-w-sm mx-auto mb-6 rounded-2xl overflow-hidden">
            <Image
              src="/team-photo.png"
              alt="Polli Digital Team"
              width={400}
              height={200}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Services */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Брендинг</span>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Сайты</span>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Маркетинг</span>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mb-6">Создаем, Запускаем, Смысл</p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12">Заказать ⚡</Button>
          <Button variant="outline" className="w-full border-gray-300 rounded-xl h-12 bg-transparent">
            Позвонить ☎
          </Button>
        </div>
      </div>

      {/* About Section */}
      <div className="px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Мы любим свое дело и дорожим репутацией</h2>

        {/* Stats */}
        <div className="space-y-4 mb-8">
          <Card className="border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">⭐</span>
              </div>
              <div>
                <div className="font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Завершенных проектов</div>
                <div className="text-xs text-gray-500 mt-1">
                  Мы работаем с крупными компаниями и частными предпринимателями, создавая решения, которые помогают
                  достичь результата.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">🎯</span>
              </div>
              <div>
                <div className="font-bold text-gray-900">15+</div>
                <div className="text-sm text-gray-600">Лет опыта</div>
                <div className="text-xs text-gray-500 mt-1">
                  Команда дизайнеров, маркетологов и разработчиков с проверенным опытом.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">🤝</span>
              </div>
              <div>
                <div className="font-bold text-gray-900">Партнерство</div>
                <div className="text-sm text-gray-600">с фондами</div>
                <div className="text-xs text-gray-500 mt-1">
                  Мы поддерживаем благотворительные инициативы. Фонд защиты детей и СЕМЕЙНАЯ СКОРАЯ.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Testimonials */}
      <div className="px-4 py-8 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Нас рекомендуют</h2>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">ОЛ</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">Оксана Л.</div>
                <div className="text-sm text-gray-600">Владелец магазина</div>
              </div>
            </div>
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Ребята сделали мне сайт для магазина одежды. Очень довольна результатом! Сайт красивый, удобный, клиенты
              легко находят то, что ищут.
            </p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-8">
            Смотреть на Яндекс Картах ⭐
          </Button>
        </div>
      </div>

      {/* Portfolio */}
      <div className="px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Наши проекты</h2>

        <div className="bg-gray-100 rounded-2xl p-6 text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm">Мобильные приложения и веб-сайты</p>
        </div>

        <div className="text-center">
          <Button variant="outline" className="rounded-xl border-gray-300 bg-transparent">
            Смотреть 👁
          </Button>
        </div>
      </div>

      {/* Contact */}
      <div className="px-4 py-8 bg-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Связаться с нами</h2>

        <div className="space-y-3 mb-6">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12">
            Оставить заявку 📝
          </Button>
          <Button variant="outline" className="w-full border-gray-300 rounded-xl h-12 bg-transparent">
            Позвонить ☎
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600 mb-4">📞 +7 (911) 934-50-08</div>
        <div className="text-center text-sm text-gray-600 mb-6">📧 info@pollidigital.moscow</div>

        {/* Map placeholder */}
        <div className="bg-gray-200 rounded-xl h-32 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>

        <p className="text-xs text-gray-600 text-center mb-6">📍 Москва, Арбатская переулок, ТЦ АФИМОЛЛ СИТИ</p>

        {/* Social Media */}
        <div className="flex justify-center gap-4">
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 p-0">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 p-0">
            <Phone className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black text-white px-4 py-6 text-center">
        <div className="text-xs space-y-1">
          <div>Договор-оферта</div>
          <div>Политика конфиденциальности</div>
        </div>
      </div>
    </div>
  )
}
