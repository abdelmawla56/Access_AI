import Image from 'next/image';

export default function StandbyScreen() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 text-center py-16">
      {/* Logo */}
      <div className="w-32 h-32 mx-auto">
        <Image
          src="/llogo/llogo.jpeg"
          alt="Symbio Tech logo"
          width={128}
          height={128}
          className="rounded-full shadow-[0_0_30px_#6c63ff]"
        />
      </div>
      {/* Standby Text */}
      <h1 className="text-3xl font-black text-white tracking-tighter">
        Standby
      </h1>
      <p className="text-sm text-brand-subtle uppercase tracking-widest">
        Tap to activate Assistant
      </p>
      <h2 className="mt-8 text-base font-bold text-brand-cyan">
        System Modules
      </h2>
      <p className="text-xs text-brand-muted uppercase tracking-wider">
        stand by origin systems
      </p>
    </section>
  );
}
