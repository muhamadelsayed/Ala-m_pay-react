// src/pages/BundleCheckout/BundleCheckout.tsx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import BreadCrumbs from "../../components/BreadCrumbs";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { useAppDispatch } from "../../hooks/useRedux";
import {
  setToastOptions,
  setToastShow,
} from "../../ReduxSlices/NotificationsSlice";
import resources from "../../translation/resources";
import pricingAxiosInstance from "../../utilities/axios/pricingInstance";
import walletAxiosInstance from "../../utilities/axios/walletInstance";
import { addMonths } from "../../utilities/Dates";
import Formatter from "../../utilities/Formatter";
import { getLocalizedValidity } from "../../utilities/Misc";
import WalletDetails from "./components/WalletDetails";
import WireTransferDetails from "../invoices/components/WireTransferDetails";
import { WalletApiData } from "../wallet/Wallet.types";
import "./BundleCheckout.css";
import { BundleApiDetails, BundleFeature } from "./PricingBundles.types";
import { setActionConfirmationData } from "../../ReduxSlices/NewModalStatesSlice";
import { setActionConfirmationShow } from "../../ReduxSlices/NewModalManagerSlice";
import { LaravelResponse } from "../../types";
import Modal from "react-bootstrap/Modal";

export default function BundleCheckout() {
  const { t } = useTranslation();
  const [iframeSrc, setIframeSrc] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  // CHANGED: Handle the possibility of location.state being null
  const bundleLocationState: BundleApiDetails | null = location.state;

  // --- >> هذا هو التعديل الأول والأهم << ---
  // هذا الـ useEffect سيحمي المكون من الانهيار
  useEffect(() => {
    // إذا لم تكن هناك بيانات للباقة، أعد التوجيه فورًا
    if (!bundleLocationState) {
      console.log("No bundle state found, redirecting...");
      navigate("/pricing-bundles"); // أو يمكنك التوجيه إلى الصفحة الرئيسية "/"
      return; // أوقف التنفيذ
    }

    const params = new URLSearchParams(location.search);
    if (params.get("payment") === "callback") {
      const status = params.get("status");

      if (status === "success") {
        setIframeSrc("");
        queryClient.invalidateQueries({ queryKey: ["bundles"] });
        dispatch(
          setToastOptions({
            autoHide: true,
            body: "تم الدفع بنجاح",
            isError: false,
          })
        );
        dispatch(setToastShow(true));
        navigate("/pricing-bundles", { replace: true });
      }
    }
  }, [bundleLocationState, location.search, navigate, dispatch, queryClient]);


  // --- >> هذا هو التعديل الثاني، "الحارس" << ---
  // إذا كانت البيانات غير موجودة، لا تكمل عرض المكون لمنع الانهيار
  if (!bundleLocationState) {
    return <div>Loading...</div>; // أو يمكنك عرض مؤشر تحميل أو null
  }


  const getBundleData = (features: Array<BundleFeature>) => {
    let price = 0;
    let validity = 0;
    for (const feature of features) {
      if (feature.key?.name === "price") {
        price = +feature.value;
      } else if (feature.key?.name === "valid_for") {
        validity = +feature.value;
      }
    }
    return { price, validity };
  };

  const { price, validity } = getBundleData(bundleLocationState.features);

  const translatedBundleName =
    bundleLocationState.name in resources.translations
      ? t(bundleLocationState.name as keyof typeof resources.translations)
      : bundleLocationState.name;

  const [selectedPayment, setSelectedPayment] = useState<
    "credit-card" | "wire-transfer" | "wallet" | undefined
  >();

  const walletDataQuery = useQuery({
    queryKey: ["walletData"],
    queryFn: () =>
      walletAxiosInstance
        .get<AxiosResponse<WalletApiData>>("/wallet/balance")
        .then((res) => res?.data?.data),
  });

  const balance = Number(walletDataQuery.data?.balance ?? 0);
  const walletAllowed = balance >= price;

  useEffect(() => {
    if (walletDataQuery.status !== "success") return;
    setSelectedPayment(walletAllowed ? "wallet" : "credit-card");
  }, [walletDataQuery.status, walletAllowed]);

  // ... (بقية الكود لا تحتاج إلى تغيير)
  const paymentOptions = useMemo(
    () => [
       // ... (paymentOptions array remains the same)
      {
        id: "wire-transfer" as const,
        name: t("WireTransfer"),
        description: t("WireTransferPaymentDetails"),
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2.5 16H17.5V17.5H2.5V16ZM4 10H5.5V15.25H4V10ZM7.75 10H9.25V15.25H7.75V10ZM10.75 10H12.25V15.25H10.75V10ZM14.5 10H16V15.25H14.5V10ZM2.5 6.25L10 2.5L17.5 6.25V9.25H2.5V6.25ZM4 7.177V7.75H16V7.177L10 4.177L4 7.177ZM10 7C9.80109 7 9.61032 6.92098 9.46967 6.78033C9.32902 6.63968 9.25 6.44891 9.25 6.25C9.25 6.05109 9.32902 5.86032 9.46967 5.71967C9.61032 5.57902 9.80109 5.5 10 5.5C10.1989 5.5 10.3897 5.57902 10.5303 5.71967C10.671 5.86032 10.75 6.05109 10.75 6.25C10.75 6.44891 10.671 6.63968 10.5303 6.78033C10.3897 6.92098 10.1989 7 10 7Z"
              fill="#525866"
            />
          </svg>
        ),
      },
      {
        id: "wallet" as const,
        name: t("Wallet"),
        description: t("WalletPaymentDetails"),
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 4.30542C3 3.03217 4.02297 2 5.28486 2H12.7626C13.1067 2 13.3857 2.2815 13.3857 2.62875C13.3857 2.976 13.1067 3.2575 12.7626 3.2575H5.28486C4.71127 3.2575 4.24629 3.72667 4.24629 4.30542V4.515H15.6706C16.9325 4.515 17.9555 5.54717 17.9555 6.82042V14.7846C17.9555 16.0578 16.9325 17.09 15.6706 17.09H5.28486C4.02297 17.09 3 16.0578 3 14.7846V4.30542ZM4.24629 5.7725V14.7846C4.24629 15.3633 4.71127 15.8325 5.28486 15.8325H15.6706C16.2442 15.8325 16.7092 15.3633 16.7092 14.7846V6.82042C16.7092 6.24167 16.2442 5.7725 15.6706 5.7725H4.24629ZM14.0089 10.3833C13.7794 10.3833 13.5934 10.571 13.5934 10.8025C13.5934 11.034 13.7794 11.2217 14.0089 11.2217C14.2383 11.2217 14.4243 11.034 14.4243 10.8025C14.4243 10.571 14.2383 10.3833 14.0089 10.3833ZM12.3472 10.8025C12.3472 9.8765 13.0911 9.12583 14.0089 9.12583C14.9266 9.12583 15.6706 9.8765 15.6706 10.8025C15.6706 11.7285 14.9266 12.4792 14.0089 12.4792C13.0911 12.4792 12.3472 11.7285 12.3472 10.8025Z"
              fill="#0A0D14"
            />
          </svg>
        ),
      },
      {
        id: "credit-card" as const,
        name: t("CreditCard"),
        description: t("CardPaymentDetails"),
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3.25 3.25H16.75C16.9489 3.25 17.1397 3.32902 17.2803 3.46967C17.421 3.61032 17.5 3.80109 17.5 4V16C17.5 16.1989 17.421 16.3897 17.2803 16.5303C17.1397 16.671 16.9489 16.75 16.75 16.75H3.25C3.05109 16.75 2.86032 16.671 2.71967 16.5303C2.57902 16.3897 2.5 16.1989 2.5 16V4C2.5 3.80109 2.57902 3.61032 2.71967 3.46967C2.86032 3.32902 3.05109 3.25 3.25 3.25ZM16 9.25H4V15.25H16V9.25ZM16 7.75V4.75H4V7.75H16ZM11.5 12.25H14.5V13.75H11.5V12.25Z"
              fill="#0A0D14"
            />
          </svg>
        ),
      },
    ],
    [t], 
  );

  function handlePaymentOptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedPayment(
      e.target.id as "credit-card" | "wire-transfer" | "wallet",
    );
  }

  // Wire transfer
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState(0);

  const buyBundleWithWalletMutation = useMutation<
    AxiosResponse<{
      url: string;
    }>,
    AxiosError,
    { bundle_id: number }
  >({
    mutationFn: (data) => pricingAxiosInstance.post("/subscription", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      navigate("/pricing-bundles");
      dispatch(
        setToastOptions({
          autoHide: true,
          body: t("BundleSubscriptionSuccess", {
            bundle: translatedBundleName,
          }),
          isError: false,
        }),
      );
      dispatch(setToastShow(true));
    },
    onError: (err) => {
      dispatch(
        setToastOptions({
          autoHide: true,
          body: t("BundleSubscriptionFailed", {
            bundle: translatedBundleName,
          }),
          isError: true, 
        }),
      );
      dispatch(setToastShow(true));
    },
  });

  const chargeForBundleMutation = useMutation<
    AxiosResponse<
      LaravelResponse<{
        payment_reference: string;
        open_modal: boolean;
      }>
    >,
    AxiosError,
    {
      payable_type: string;
      payable_id: number;
      amount: number;
    }
  >({
    mutationFn: (data) =>
      walletAxiosInstance.post("/wallet/payment-link", {
        return_url: `${window.location.origin}${location.pathname}?payment=callback`,
        ...data,
      }),
    onSuccess: (res) => {
      const url = res.data.data.payment_reference;
      if (!url) return;
      if (!res.data.data.open_modal) {
        window.location.href = url;
      } else {
        setIframeSrc(url);
      }
    },
  });

  const wireTransferChargeForBundleMutation = useMutation<
    AxiosResponse<
      LaravelResponse<{
        status: string;
      }>
    >,
    AxiosError,
    {
      bundle_id: number;
      file: File;
      amount: number;
    }
  >({
    mutationFn: ({ bundle_id, file, amount }) => {
      const formData = new FormData();
      formData.append("amount", amount.toString());
      formData.append("receipt", file);
      formData.append("payable_type", "bundle");
      formData.append("payable_id", `${bundle_id}`);
      return walletAxiosInstance.post("/wallet/wire-transfer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["bundles"] });
        navigate("/pricing-bundles");
        dispatch(
          setToastOptions({
            autoHide: true,
            body: t("BundleSubscriptionSuccess", {
              bundle: translatedBundleName,
            }),
            isError: false,
          }),
        );
        dispatch(setToastShow(true));
      } else {
        dispatch(
          setToastOptions({
            autoHide: true,
            body: t("BundleSubscriptionFailed", {
              bundle: translatedBundleName,
            }),
            isError: true,
          }),
        );
        dispatch(setToastShow(true));
      }
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    switch (selectedPayment) {
      case "credit-card":
        chargeForBundleMutation.mutate({
          payable_type: "bundle",
          payable_id: bundleLocationState.id,
          amount: price,
        });
        break;
      case "wire-transfer":
        if (file) {
            wireTransferChargeForBundleMutation.mutate({
            bundle_id: bundleLocationState.id,
            file: file,
            amount: price,
            });
        }
        break;
      case "wallet": {
        if (!walletAllowed) {
          dispatch(setActionConfirmationShow(true));
          dispatch(
            setActionConfirmationData({
              title: t("InsufficientBalance"),
              message: t("ByClickingContinueYouWillBeRedirectedToChargeWallet"),
              action: "charge_to_buy_bundle",
              data: {
                bundle_id: bundleLocationState.id,
              },
            }),
          );
        } else
          buyBundleWithWalletMutation.mutate({
            bundle_id: bundleLocationState.id,
          });
        break;
      }
    }
  }

  function handleCloseModal() {
    setIframeSrc("");
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <BreadCrumbs
          steps={[
            {
              svg: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M13.7343 13.4956C12.2242 14.0753 11 13.234 11 11.6164C11 9.99875 12.2242 8.21759 13.7343 7.63789C15.2445 7.05819 16.4686 7.89953 16.4686 9.51714C16.4686 11.1347 15.2445 12.9159 13.7343 13.4956ZM13.7343 12.9098C14.3145 12.6871 14.8709 12.2267 15.2811 11.6298C15.6913 11.0329 15.9218 10.3485 15.9218 9.72706C15.9218 9.10564 15.6913 8.59813 15.2811 8.31619C14.8709 8.03425 14.3145 8.00096 13.7343 8.22366C13.1542 8.44636 12.5978 8.9068 12.1876 9.50368C11.7773 10.1006 11.5469 10.785 11.5469 11.4064C11.5469 12.0279 11.7773 12.5354 12.1876 12.8173C12.5978 13.0992 13.1542 13.1325 13.7343 12.9098V12.9098ZM12.7773 11.5199L14.2812 10.9426C14.3174 10.9287 14.3522 10.8999 14.3779 10.8626C14.4035 10.8253 14.4179 10.7825 14.4179 10.7437C14.4179 10.7048 14.4035 10.6731 14.3779 10.6555C14.3522 10.6379 14.3174 10.6358 14.2812 10.6497L13.1875 11.0696C13.0062 11.1391 12.8323 11.1287 12.7041 11.0406C12.5759 10.9525 12.5039 10.7939 12.5039 10.5997C12.5039 10.4055 12.5759 10.1917 12.7041 10.0051C12.8323 9.81861 13.0062 9.67472 13.1875 9.60513L13.4609 9.50017V8.9144L14.0078 8.70447V9.29024L14.6913 9.02784V9.61361L13.1875 10.1909C13.1512 10.2048 13.1164 10.2336 13.0908 10.2709C13.0651 10.3082 13.0507 10.351 13.0507 10.3898C13.0507 10.4287 13.0651 10.4604 13.0908 10.478C13.1164 10.4956 13.1512 10.4977 13.1875 10.4838L14.2812 10.0639C14.4625 9.99435 14.6364 10.0047 14.7646 10.0929C14.8927 10.181 14.9648 10.3396 14.9648 10.5338C14.9648 10.7279 14.8927 10.9418 14.7646 11.1284C14.6364 11.3149 14.4625 11.4588 14.2812 11.5284L14.0078 11.6333V12.2191L13.4609 12.429V11.8432L12.7773 12.1057V11.5199Z"
                    fill="#525866"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.00823 2.45049C3.03464 3.57551 2.16303 3.91993 2.09171 3.99809L2.05222 4.04139C2.01863 4.07824 2 4.1263 2 4.17616V9.04034C2 13.917 2.00104 13.9833 2.07973 14.0776C2.14172 14.1519 3.02118 14.4982 6.02634 15.6316C8.15308 16.4337 9.92924 17.09 9.97327 17.09C10.0173 17.09 11.7935 16.4337 13.9202 15.6316C16.9254 14.4982 17.8048 14.1519 17.8668 14.0776C17.9455 13.9833 17.9465 13.917 17.9465 9.03531V4.17531C17.9465 4.12 17.9236 4.06715 17.8833 4.02934L17.8364 3.9854C17.6987 3.8565 10.1418 0.994643 9.95324 1.00001C9.88713 1.0019 8.11189 1.65462 6.00823 2.45049ZM11.3252 2.24634C12.0471 2.51811 12.6512 2.75275 12.6678 2.76775C12.6844 2.78274 11.2309 3.34828 9.43782 4.0245L6.24815 5.22742C6.20275 5.24454 6.15267 5.24457 6.10724 5.2275L4.81052 4.74032C4.05859 4.45781 3.44384 4.21815 3.4444 4.20776C3.44573 4.18419 9.89458 1.75685 9.96297 1.75417C9.99038 1.75307 10.6034 1.97456 11.3252 2.24634ZM15.1504 3.68696C15.8934 3.963 16.5017 4.19737 16.5021 4.20776C16.5034 4.23455 10.0459 6.66332 9.97343 6.66332C9.90139 6.66332 7.2497 5.67025 7.24978 5.64332C7.24986 5.61929 13.6588 3.19649 13.7395 3.18991C13.7726 3.18723 14.4075 3.41091 15.1504 3.68696ZM4.41402 5.36131L5.67692 5.83768C5.75479 5.86705 5.80634 5.94158 5.80634 6.02481V7.25424V8.54571C5.80634 8.59483 5.82442 8.64224 5.85713 8.67889L5.91007 8.73819C6.06957 8.91696 6.37508 8.89338 6.49656 8.69301C6.53371 8.63177 6.55302 8.27847 6.5676 7.39425L6.58295 6.46382C6.58523 6.3254 6.72407 6.2311 6.85359 6.28002L8.01 6.71678C8.79231 7.01224 9.47292 7.27468 9.52252 7.29999V7.29999C9.57784 7.3282 9.61267 7.38506 9.61267 7.44716V11.7674C9.61267 15.4486 9.60366 16.1868 9.55886 16.1766C9.52929 16.1699 8.84491 15.9179 8.03801 15.6167L6.69987 15.117C6.62226 15.088 6.57055 15.0142 6.56984 14.9313L6.55927 13.6835L6.54826 12.3799C6.54782 12.3275 6.52687 12.2775 6.48991 12.2404L6.45361 12.204C6.28513 12.035 6.06793 12.0417 5.89031 12.2215C5.80866 12.3041 5.80634 12.34 5.80634 13.5271C5.80634 14.1985 5.79279 14.7485 5.77629 14.7493C5.75978 14.7501 5.0748 14.4994 4.25419 14.1921L2.892 13.682C2.8139 13.6527 2.76214 13.5781 2.76213 13.4947L2.76171 9.1845L2.76128 4.8752C2.76127 4.80797 2.82876 4.76167 2.89148 4.78588V4.78588C2.96308 4.81353 3.64822 5.0725 4.41402 5.36131ZM17.1846 9.18499L17.184 13.4948C17.184 13.5781 17.1323 13.6527 17.0543 13.682L13.8134 14.8989C11.9596 15.5949 10.4184 16.1699 10.3884 16.1766C10.3426 16.1869 10.3339 15.4767 10.3339 11.7674V7.44709C10.3339 7.38505 10.3687 7.32826 10.424 7.30014V7.30014C10.4941 7.26455 17.1334 4.74515 17.1753 4.73828C17.1807 4.73741 17.185 6.73838 17.1846 9.18499Z"
                    fill="#525866"
                    stroke="#525866"
                    strokeWidth="0.5"
                  />
                </svg>
              ),
              title: t("PricingBundles"),
              path: "/pricing-bundles",
            },
            {
              title: translatedBundleName,
            },
          ]}
        />
        <div className="payment-grid">
          <div className="d-block">
            <h6 className="payment-title mb-1">{t("PaymentMethod")}</h6>
            <div className="payment-options-grid">
              {paymentOptions.map((paymentOption, index) => (
                <label
                  htmlFor={paymentOption.id}
                  className={`payment-option ${
                    index === 2 ? "two-col-span" : ""
                  }`}
                  key={paymentOption.id}
                >
                  <div className="payment-icon-container">
                    {paymentOption.icon}
                  </div>
                  <div className="d-flex flx-vertical">
                    <p className="payment-option-title">{paymentOption.name}</p>
                    <p className="payment-option-desc">
                      {paymentOption.description}
                    </p>
                  </div>
                  <div className="mis-auto d-flex">
                    <input
                      type="radio"
                      name="payment-options"
                      className="new-radio"
                      id={paymentOption.id}
                      checked={paymentOption.id === selectedPayment}
                      onChange={handlePaymentOptionChange}
                    />
                  </div>
                  {paymentOption.id === selectedPayment && (
                    <div className="payment-option-checkmark">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M7.5 13.75L4.16667 10.4167L5.41667 9.16667L7.5 11.25L14.5833 4.16667L15.8333 5.41667L7.5 13.75Z"
                          fill="#fff"
                        />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
            {selectedPayment === "wallet" ? (
              <WalletDetails
                balance={balance}
                walletAllowed={walletAllowed}
                totalAmount={price}
                isLoading={walletDataQuery.isLoading}
              />
            ) : selectedPayment === "wire-transfer" ? (
              <WireTransferDetails
                file={file}
                setFile={setFile}
                amount={price} 
                setAmount={setAmount} 
                showAmountInput={false}
              />
            ) : null}
            <Button
              className="mt-4 d-none d-xl-block"
              type="submit"
              disabled={
                !selectedPayment ||
                (selectedPayment === "wallet" && walletDataQuery.isLoading) ||
                (selectedPayment === "wire-transfer" && !file) 
              }
              isLoading={
                chargeForBundleMutation.isPending ||
                wireTransferChargeForBundleMutation.isPending ||
                buyBundleWithWalletMutation.isPending
              }
              fullWidth
            >
              {t("ConfirmPayment")}
            </Button>
          </div>
          <div>
            <Card className="p-4">
              <div className="d-block">
                <h6 className="payment-invoice-summary-title">
                  {t("BundleSummary")}
                </h6>
                <hr className="new-divider mt-2" />
              </div>
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-detail-title">{t("Bundle")}</p>
                <p className="payment-invoice-detail-value">
                  {translatedBundleName}
                </p>
              </div>
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-detail-title">
                  {t("StartingDate")}
                </p>
                <p className="payment-invoice-detail-value">
                  {Formatter.formatDate(new Date(), {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-detail-title">
                  {t("ExpirationDate")}
                </p>
                <p className="payment-invoice-detail-value">
                  {Formatter.formatDate(addMonths(new Date(), validity), {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-detail-title">{t("Validity")}</p>
                <p className="payment-invoice-detail-value">
                  {t(getLocalizedValidity(validity) ?? "N/A")}
                </p>
              </div>
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-detail-title">{t("Amount")}</p>
                <p className="payment-invoice-detail-value">
                  {Formatter.formatCurrency(price)}
                </p>
              </div>
              <hr className="new-divider" />
              <div className="d-flex ai-c jc-sb">
                <p className="payment-invoice-total-title">
                  {t("TotalAmount")}
                </p>
                <p className="payment-invoice-total-value">
                  {Formatter.formatCurrency(price)}
                </p>
              </div>
            </Card>
          </div>
        </div>
        <Button
          className="mt-4 d-block d-xl-none"
          type="submit"
          disabled={
            !selectedPayment ||
            (selectedPayment === "wallet" && walletDataQuery.isLoading) ||
            (selectedPayment === "wire-transfer" && !file)
          }
          isLoading={
            chargeForBundleMutation.isPending ||
            wireTransferChargeForBundleMutation.isPending ||
            buyBundleWithWalletMutation.isPending
          }
          fullWidth
        >
          {t("ConfirmPayment")}
        </Button>
      </form>
      <Modal
        show={Boolean(iframeSrc)}
        onHide={handleCloseModal}
        onExited={handleCloseModal}
        contentClassName="rounded-modal charge-wallet-modal"
        centered
      >
        <Modal.Body className="d-flex flx-vertical gap-4">
          <iframe
            src={iframeSrc}
            title="Payment Gateway"
            width="100%"
            height="600px"
            frameBorder="0"
          />
        </Modal.Body>
      </Modal>
    </>
  );
}