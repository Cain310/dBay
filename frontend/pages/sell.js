import CreateItem from "../components/CreateItem";
import Link from "next/link";
import PleaseSignIn from "../components/PleaseSignIn";

const Sell = props => (
  <div>
    <PleaseSignIn>
      <CreateItem />
    </PleaseSignIn>
  </div>
);

export default Sell;
