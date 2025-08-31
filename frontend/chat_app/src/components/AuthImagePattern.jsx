const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-transparent p-12">
      <div className="max-w-md text-center text-white">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl ${
                i % 2 === 0
                  ? "bg-white/10 animate-pulse"
                  : "bg-white/5"
              }`}
            />
          ))}
        </div>
        <div className="mt-4">
         <h2 className="text-2xl font-bold ">{title}</h2>
        <p className="text-white/60 mt-4">{subtitle}</p> 
        </div>
      </div>
    </div>
  );
};

export default AuthImagePattern;
