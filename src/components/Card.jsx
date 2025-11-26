import loadingDots from '../assets/loadingDots.gif';
const Card = ({ content = '--', count = '--', loaderStatus = false }) => {
  return (
    <div className="max-w-sm  bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className=" flex items-center text-xl font-semibold mb-2 ">
          <span>{`${content}  :`} </span>
          {loaderStatus ? (
            <img className="w-32" src={loadingDots} />
          ) : (
            <span className="ml-5"> {count} </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
