import Card from '../components/Card';

const Lead = () => {
  return (
    <div className="p-6 ">
      <div className="flex justify-between items-center">
        <div></div>
        <div className="flex justify-between items-center gap-10">
          <Card content="Total Leads" count={0} />
          <button className="bg-green-500 hover:bg-green-700  transition text-white px-4 py-2 rounded-lg cursor-pointer">
            Create Leads
          </button>
          <button className="bg-blue-400 hover:bg-blue-700 transition text-white px-4 py-2 rounded-lg cursor-pointer">
            Import Leads
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lead;
