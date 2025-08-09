import Image from "next/image";

export function CardPersediaan({
  imageUrl,
  title,
  amount,
  description,
}: {
  imageUrl: string;
  title: string;
  amount: string;
  description: string;
}) {
  return (
    <div className="bg-[#EAF6E5] rounded-xl p-5 flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-gradient-to-b from-green-400 to-green-700 flex items-center justify-center">
        <Image
          src={`${imageUrl}`}
          alt="Icon Persediaan"
          width={28}
          height={28}
        />
      </div>

      <div>
        <p className="text-green-800 text-sm font-medium">{title}</p>
        <p className="text-green-900 text-2xl font-bold">{amount}</p>
        <p className="text-green-800 text-xs">{description}</p>
      </div>
    </div>
  );
}
