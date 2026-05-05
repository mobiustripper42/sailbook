import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'American Sailing Classes | SailBook',
  description:
    'ASA-certified sailing classes — beginner to advanced. Learn keelboat sailing with experienced instructors in a supportive atmosphere.',
}

type Course = {
  code: string
  subtitle: string
  description: string
  prereq?: string
  durationPrice: string
  bullets?: string[]
  image: string
  registerHref: string
}

const courses: Course[] = [
  {
    code: 'ASA101',
    subtitle: 'Sailing Made Easy',
    description:
      'Learn to skipper a 20′ – 27′ sloop-rigged keelboat by day, in light to moderate winds and sea conditions. Learn basic sailing terminology, parts and functions, helm commands, basic sail trim, points of sail, buoyage, seamanship and safety including basic navigation rules to avoid collisions and hazards. More than anything, our sailing classes are fun',
    durationPrice: '2 Days – $550',
    bullets: [
      'Cost $550 per person',
      "You will receive ASA's Sailing Made Easy text and Logbook",
      'One online pre-course',
      'One introductory Zoom call',
      'Two full on the water sailing days (sat/sun from 8:15am-4:30pm each day)',
      'One certification exam',
      '3 months of trial membership to ASA',
      'Most classes are on the weekends, May through October',
    ],
    image: '/sailing-classes/asa-101.jpg',
    registerHref: '/courses/asa101',
  },
  {
    code: 'ASA102',
    subtitle: 'Keelboat 2',
    description:
      'Able to skipper and crew aboard a sloop-rigged keelboat of approximately 20 to 30 feet in length by day in winds up to 20 knots. Depart, sail, and return with control demonstrating teamwork. ASA 101 is a prerequisite, plus the ability to demonstrate competencies in all knowledge and skills elements of that Standard. ASA 101 or equivalent sailing skills & experience.',
    durationPrice: '2 Days – $550',
    bullets: [
      'Cost $550 per person',
      "You will receive ASA's Basic Keelboat 2 text and Logbook",
      'One online pre-course',
      'One introductory Zoom call',
      'Two full on the water sailing days (sat/sun from 8:15am-4:30pm each day)',
      'One certification exam',
      'Most classes are on the weekends, May through October',
    ],
    image: '/sailing-classes/asa-102.png',
    registerHref: '/courses/asa102',
  },
  {
    code: 'ASA103',
    subtitle: 'Coastal Cruising Made Easy',
    description:
      "Learn to skipper a sloop-rigged auxiliary powered 25′-35′ keelboat by day in moderate winds and sea conditions. Learn cruising sailboat terminology, basic boat systems, auxiliary engine operation, docking procedures, intermediate sail trim, navigation rules, basic coastal navigation, anchoring, weather, safety and seamanship.",
    prereq: 'Prerequisite: ASA101.',
    durationPrice: '2 Days – $585',
    image: '/sailing-classes/asa-103.jpg',
    registerHref: '/courses/asa103',
  },
  {
    code: 'ASA104',
    subtitle: 'Bareboat Cruising Made Easy',
    description:
      'Learn how to sail a sloop-rigged, auxiliary powered 30′-45′ sailboat during a multi-day cruise upon inland/coastal waters in moderate/heavy winds and sea conditions. Learn about provisioning, boat systems, auxiliary engines, advanced sail trim, coastal navigation, anchoring / mooring, docking, emergency operations, weather, and more.',
    prereq: 'Prerequisite: ASA101, 103.',
    durationPrice: '3 Days, 2 Nights – $895',
    image: '/sailing-classes/asa-104.jpg',
    registerHref: '/courses/asa104',
  },
  {
    code: 'ASA105',
    subtitle: 'Coastal Navigation',
    description:
      'Learn the the navigational theory and practices for safe navigation of a sailing vessel in coastal and inland waters.',
    durationPrice: '2 Days – $695',
    image: '/sailing-classes/asa-105.png',
    registerHref: '/courses/asa105',
  },
  {
    code: 'ASA118',
    subtitle: 'Docking Endorsement',
    description:
      'Learn basic docking skills for boats with single inboard or outboard engines. Discover the basic theory and hands-on techniques needed to dock and undock boats in an efficient manner and without damage or injury.',
    durationPrice: '1 Day – $395',
    image: '/sailing-classes/asa-118.png',
    registerHref: '/courses/asa118',
  },
]

export default function SailingClassesPage() {
  return (
    <div className="bg-white text-slate-900">
      <section className="relative h-[420px] sm:h-[480px] flex items-center justify-center overflow-hidden">
        <Image
          src="/sailing-classes/hero.jpg"
          alt="Sailing on Lake Erie with Cleveland skyline"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/40" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h1 className="text-3xl sm:text-5xl font-bold uppercase tracking-tight leading-tight">
            Discover the Thrill of Sailing
          </h1>
          <p className="mt-3 text-base sm:text-2xl font-semibold uppercase tracking-wide">
            With Sailing Classes at Learn to Sail Cleveland!
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-center text-base sm:text-lg leading-relaxed text-slate-700 max-w-3xl mx-auto">
          Whether you're a total beginner or want to sharpen your skills, our sailing classes make
          learning a breeze. With experienced instructors, a supportive atmosphere, and the best
          views of Cleveland's skyline, you'll be confidently charting your course in no time.
          Dive into sailing classes with us—experience the thrill, freedom, and adventure that
          only the water can offer!
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
          {courses.map((c) => (
            <article key={c.code} className="flex flex-col items-center text-center">
              <div className="relative w-full max-w-[260px] aspect-square mb-6">
                <Image
                  src={c.image}
                  alt={`${c.code} ${c.subtitle}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 260px"
                  loading="eager"
                  className="object-contain"
                />
              </div>

              <h2 className="text-xl font-bold mb-3">
                <span className="font-bold">{c.code}</span>{' '}
                <span className="text-2xl font-semibold">{c.subtitle}</span>
              </h2>

              <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 max-w-md">
                {c.prereq && <em className="font-medium">{c.prereq} </em>}
                {c.description}
              </p>

              <p className="text-sm sm:text-base text-slate-700 mb-4">{c.durationPrice}</p>

              {c.bullets && (
                <ul className="text-sm sm:text-base text-slate-700 text-left space-y-1.5 mb-6 max-w-md w-full list-none">
                  {c.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-sky-600 shrink-0" aria-hidden>
                        ⚓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={c.registerHref}
                className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold uppercase tracking-wider text-sm px-8 py-3 rounded-sm transition-colors mt-auto"
              >
                Register Here
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

